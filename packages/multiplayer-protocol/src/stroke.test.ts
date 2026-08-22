import { describe, expect, it } from 'vitest';

import { PeerStroke } from './room.ts';
import { appendStrokePoints } from './stroke.ts';

const points = (count: number, from = 0) =>
  Array.from({ length: count }, (_, i) => ({ x: from + i, y: 0 }));

const stroke = (mode: PeerStroke['mode']): PeerStroke => ({
  id: 'stroke-1',
  mode,
  points: [],
  fillColor: '#ff0000',
  brushWeight: 6,
});

describe('appendStrokePoints', () => {
  it('accumulates deltas in the order they arrive', () => {
    const drawing = stroke('drawing');

    appendStrokePoints(drawing, points(2));
    appendStrokePoints(drawing, points(2, 2));

    expect(drawing.points).toEqual(points(4));
  });

  it('keeps every point of a drawing, since every point commits', () => {
    const drawing = stroke('drawing');

    appendStrokePoints(drawing, points(2_000));

    expect(drawing.points).toHaveLength(2_000);
  });

  it('holds a laser near what can be on screen, however long it runs', () => {
    const laser = stroke('laser');

    for (let i = 0; i < 100; i++) appendStrokePoints(laser, points(10, i * 10));

    // a laser shows a tail rather than a history, so the buffer cannot grow with the
    // gesture: it would paint nothing extra and ship all of it to the next arrival
    expect(laser.points.length).toBeLessThan(1_000);
    // and what it keeps is the newest of it
    expect(laser.points.at(-1)).toEqual({ x: 999, y: 0 });
  });
});
