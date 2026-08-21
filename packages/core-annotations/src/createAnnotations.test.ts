import type { CanvasSurface } from '@canvas/surface/types';
import { describe, expect, it, vi } from 'vitest';

import { ERASER_BRUSH_RADIUS } from './constants.ts';
import { createAnnotations } from './createAnnotations.ts';
import type { AnnotationsChange } from './events.ts';

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

  it('eats the laser trail once the cursor stops moving', () => {
    vi.useFakeTimers();
    const { annotations } = setup();
    annotations.setMode('laser');
    const trailPainted = () =>
      annotations
        .canvasElements()
        .filter(({ id }) => id.startsWith('annotation-laser-trail')).length;

    annotations.beginStroke({ x: 0, y: 0 });
    annotations.extendStroke({ x: 200, y: 0 });
    expect(trailPainted()).toBeGreaterThan(0);

    vi.advanceTimersByTime(1000);

    expect(trailPainted()).toBe(0);
    vi.useRealTimers();
  });

  it('holds the mode a stroke began in, so picking a tool mid stroke commits nothing', () => {
    vi.useFakeTimers();
    const { annotations, changes } = setup();
    annotations.setMode('laser');

    annotations.beginStroke({ x: 0, y: 0 });
    annotations.extendStroke({ x: 50, y: 0 });
    annotations.setMode('drawing');
    annotations.endStroke();

    expect(annotations.annotations()).toEqual([]);
    expect(changes).toEqual([]);
    expect(vi.getTimerCount()).toBe(0);
    vi.useRealTimers();
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

    expect(annotations.mode()).toBe('drawing');
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
