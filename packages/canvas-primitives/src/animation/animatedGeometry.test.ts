import { describe, expect, it } from 'vitest';

import { createAnimatedShapes } from './index.ts';

const startLineEntrance = () => {
  const { shapes, tick, defineTimeline, getAnimatedSchema } =
    createAnimatedShapes();

  const schema = {
    id: 'e1',
    start: { x: 0, y: 0 },
    end: { x: 100, y: 0 },
    lineWidth: 4,
  };

  const line = shapes.line(schema);

  const { play } = defineTimeline({
    forShapes: ['line'],
    durationMs: 500,
    keyframes: [{ progress: 0, properties: { lineWidth: 0 } }],
  });

  const now = 1000;
  tick(now);
  play({ shapeId: 'e1', runCount: 1 });

  // the draw pass is what resolves a shape through its animations
  const drawAt = (at: number) => {
    tick(at);
    void line.draw;
    return getAnimatedSchema('e1');
  };

  return { schema, drawAt, now };
};

describe('a shape animating while its geometry moves', () => {
  it('resolves the geometry it is handed now, not the one it started with', () => {
    const { schema, drawAt, now } = startLineEntrance();

    expect(drawAt(now)).toMatchObject({
      start: { x: 0, y: 0 },
      end: { x: 100, y: 0 },
    });

    schema.start = { x: 50, y: 0 };
    schema.end = { x: 150, y: 0 };

    expect(drawAt(now + 100)).toMatchObject({
      start: { x: 50, y: 0 },
      end: { x: 150, y: 0 },
    });
  });

  it('keeps animating the properties its timeline owns', () => {
    const { schema, drawAt, now } = startLineEntrance();

    expect(drawAt(now)?.lineWidth).toBe(0);

    schema.start = { x: 50, y: 0 };
    const midway = drawAt(now + 250);

    expect(midway?.lineWidth).toBeGreaterThan(0);
    expect(midway?.lineWidth).toBeLessThan(4);
    expect(midway).toMatchObject({ start: { x: 50, y: 0 } });
  });
});
