import type { CanvasSurface } from '@canvas/surface/types';
import { describe, expect, it, vi } from 'vitest';

import {
  ANNOTATION_IN_PROGRESS_PRIORITY,
  ERASER_BRUSH_RADIUS,
  LASER_DECAY_MS,
  LASER_HOLD_MS,
} from './constants.ts';
import { createAnnotations } from './createAnnotations.ts';
import type { AnnotationsChange } from './events.ts';
import type { InFlightStroke } from './types.ts';

/** only the cursor is read off the surface, and only to paint the tool under it */
const stubSurface = () =>
  ({ cursorCoordinates: { value: { x: 0, y: 0 } } }) as CanvasSurface;

const setup = () => {
  const annotations = createAnnotations({ surface: stubSurface() });
  const changes: AnnotationsChange[] = [];
  annotations.events.subscribe('onAnnotationsChanged', (change) =>
    changes.push(change),
  );
  annotations.activate();
  return { annotations, changes };
};

/** how far the trail in flight reaches */
const inFlightWidth = (annotations: ReturnType<typeof createAnnotations>) =>
  annotations
    .canvasElements()
    .find(({ priority }) => priority === ANNOTATION_IN_PROGRESS_PRIORITY)
    ?.shape.getBoundingBox().width;

const drawStroke = (
  annotations: ReturnType<typeof createAnnotations>,
  from = { x: 0, y: 0 },
  to = { x: 10, y: 0 },
) => {
  annotations.beginStroke(from);
  annotations.extendStroke(to);
  annotations.endStroke();
};

describe('annotations', () => {
  it('commits a finished stroke with the selected color and brush weight', () => {
    const { annotations, changes } = setup();
    annotations.setColor('#ff0000');
    annotations.setBrushWeight(9);

    drawStroke(annotations);

    const [annotation] = annotations.annotations();
    expect(annotation.points).toEqual([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
    ]);
    expect(annotation.fillColor).toBe('#ff0000');
    expect(annotation.brushWeight).toBe(9);
    expect(changes).toEqual([{ added: [annotation], removedIds: [] }]);
  });

  it('leaves nothing behind for a laser stroke', () => {
    const { annotations, changes } = setup();
    annotations.setMode('laser');

    drawStroke(annotations);

    expect(annotations.annotations()).toEqual([]);
    expect(changes).toEqual([]);
  });

  it('erases every annotation the eraser passes over', () => {
    const { annotations, changes } = setup();
    drawStroke(annotations);
    drawStroke(annotations, { x: 500, y: 500 }, { x: 510, y: 500 });
    const [erased, untouched] = annotations.annotations();
    changes.length = 0;

    annotations.setMode('erasing');
    annotations.beginStroke({ x: 5, y: ERASER_BRUSH_RADIUS / 2 });
    annotations.endStroke();

    expect(annotations.annotations()).toEqual([untouched]);
    expect(changes).toEqual([{ added: [], removedIds: [erased.id] }]);
  });

  it('reports only what actually changed when the whole set is written', () => {
    const { annotations, changes } = setup();
    drawStroke(annotations);
    const [kept] = annotations.annotations();
    const arriving = { ...kept, id: 'from-somewhere-else' };
    changes.length = 0;

    annotations.setAll([kept, arriving]);

    expect(changes).toEqual([{ added: [arriving], removedIds: [] }]);
    expect(annotations.annotations()).toEqual([kept, arriving]);
  });

  it('triggers the activation events only on a real transition', () => {
    const annotations = createAnnotations({ surface: stubSurface() });
    const transitions: string[] = [];
    annotations.events.subscribe('onActivated', () => transitions.push('on'));
    annotations.events.subscribe('onDeactivated', () =>
      transitions.push('off'),
    );

    // the second call of each pair is the no-op a caller cannot know it is making
    annotations.deactivate();
    annotations.activate();
    annotations.activate();
    annotations.toggle();
    annotations.deactivate();

    expect(transitions).toEqual(['on', 'off']);
  });

  it('drops the stroke in flight when the tools are put away', () => {
    const { annotations, changes } = setup();
    annotations.setMode('erasing');
    annotations.beginStroke({ x: 0, y: 0 });

    annotations.deactivate();
    annotations.endStroke();

    expect(annotations.isActive()).toBe(false);
    expect(changes).toEqual([]);
  });

  it('keeps painting committed annotations once the tools are put away', () => {
    const { annotations } = setup();
    drawStroke(annotations);
    const painted = () => annotations.canvasElements().map(({ id }) => id);
    const [committed] = annotations.annotations();

    annotations.setMode('erasing');
    expect(painted()).toHaveLength(2);

    annotations.deactivate();
    expect(painted()).toEqual([committed.id]);
  });

  it('does not spring the laser trail back out once it has retreated', () => {
    vi.useFakeTimers();
    const { annotations } = setup();
    annotations.setMode('laser');

    annotations.beginStroke({ x: 0, y: 0 });
    for (let i = 1; i <= 40; i++) annotations.extendStroke({ x: i * 10, y: 0 });

    expect(inFlightWidth(annotations)).toBeGreaterThan(100);

    // held down and held still, long enough to bleed off
    vi.advanceTimersByTime(LASER_HOLD_MS + LASER_DECAY_MS);
    expect(inFlightWidth(annotations)).toBeLessThan(10);

    // moving puts the decay budget back to full, so a buffer that kept its retreated
    // points would redraw the path taken before the pause
    annotations.extendStroke({ x: 405, y: 0 });
    expect(inFlightWidth(annotations)).toBeLessThan(20);

    vi.useRealTimers();
  });

  it('stops the laser decay timer rather than leaving it running', () => {
    vi.useFakeTimers();
    const { annotations } = setup();
    annotations.setMode('laser');

    annotations.beginStroke({ x: 0, y: 0 });
    annotations.extendStroke({ x: 10, y: 0 });
    annotations.endStroke();

    expect(vi.getTimerCount()).toBe(0);
    vi.useRealTimers();
  });
});

/** what a host relaying the stroke sees, in the order it sees it */
const watchStroke = (annotations: ReturnType<typeof createAnnotations>) => {
  const began: InFlightStroke[] = [];
  const extended: (readonly { x: number; y: number }[])[] = [];
  let endedCount = 0;

  annotations.events.subscribe('onStrokeBegan', (stroke) => began.push(stroke));
  annotations.events.subscribe('onStrokeExtended', (points) =>
    extended.push(points),
  );
  annotations.events.subscribe('onStrokeEnded', () => (endedCount += 1));

  return { began, extended, ended: () => endedCount };
};

describe('the stroke in flight', () => {
  it('names the annotation it will become before it becomes one', () => {
    const { annotations } = setup();
    const stroke = watchStroke(annotations);

    drawStroke(annotations);

    const [committed] = annotations.annotations();
    expect(stroke.began).toHaveLength(1);
    expect(stroke.began[0].id).toBe(committed.id);
  });

  it('reports the mode, color and weight the stroke is being drawn with', () => {
    const { annotations } = setup();
    annotations.setColor('#00ff00');
    annotations.setBrushWeight(4);
    const stroke = watchStroke(annotations);

    annotations.beginStroke({ x: 1, y: 2 });

    expect(stroke.began[0]).toMatchObject({
      mode: 'drawing',
      points: [{ x: 1, y: 2 }],
      fillColor: '#00ff00',
      brushWeight: 4,
    });
  });

  it('carries only the points added since the last report', () => {
    const { annotations } = setup();
    const stroke = watchStroke(annotations);

    annotations.beginStroke({ x: 0, y: 0 });
    annotations.extendStroke({ x: 1, y: 0 });
    annotations.extendStroke({ x: 2, y: 0 });

    expect(stroke.extended).toEqual([[{ x: 1, y: 0 }], [{ x: 2, y: 0 }]]);
  });

  it('announces the laser, which has no other way to be seen', () => {
    const { annotations } = setup();
    annotations.setMode('laser');
    const stroke = watchStroke(annotations);

    drawStroke(annotations);

    expect(stroke.began[0]).toMatchObject({ mode: 'laser' });
    expect(stroke.ended()).toBe(1);
    expect(annotations.annotations()).toEqual([]);
  });

  it('commits before it calls the stroke over', () => {
    const { annotations } = setup();
    let committedWhenEnded: string[] = [];
    annotations.events.subscribe('onStrokeEnded', () => {
      committedWhenEnded = annotations.annotations().map(({ id }) => id);
    });

    drawStroke(annotations);

    // a host relaying both hands over what replaces the live stroke before it says to
    // drop it, which is what keeps the handoff from blinking
    expect(committedWhenEnded).toEqual(
      annotations.annotations().map(({ id }) => id),
    );
    expect(committedWhenEnded).toHaveLength(1);
  });

  it('says nothing about an erase, which draws nothing on the way', () => {
    const { annotations } = setup();
    drawStroke(annotations);

    annotations.setMode('erasing');
    const stroke = watchStroke(annotations);
    drawStroke(annotations);

    expect(stroke.began).toEqual([]);
    expect(stroke.extended).toEqual([]);
    expect(stroke.ended()).toBe(0);
  });

  it('calls an abandoned stroke over, so nothing is left holding it', () => {
    const { annotations } = setup();
    const stroke = watchStroke(annotations);

    annotations.beginStroke({ x: 0, y: 0 });
    annotations.extendStroke({ x: 5, y: 0 });
    annotations.deactivate();

    expect(stroke.ended()).toBe(1);
    expect(annotations.annotations()).toEqual([]);
  });

  it('does not call a stroke over when there was none in flight', () => {
    const { annotations } = setup();
    const stroke = watchStroke(annotations);

    annotations.deactivate();

    expect(stroke.ended()).toBe(0);
  });
});
