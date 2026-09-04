import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { region } from './index.ts';

vi.mock('@core/utils/canvas/index', () => ({
  getClientCoordinates: vi.fn(),
  getCtx: vi.fn(),
}));

/** enough of Path2D for a draw to build clips against; jsdom provides none */
class StubPath2D {
  rect() {}
  ellipse() {}
  moveTo() {}
  lineTo() {}
  closePath() {}
  roundRect() {}
  addPath() {}
}

beforeAll(() => {
  vi.stubGlobal('Path2D', StubPath2D);
});

afterAll(() => {
  vi.unstubAllGlobals();
});

const bounds = { at: { x: 0, y: 0 }, width: 100, height: 100 };

const drawingCtx = () => {
  const calls: string[] = [];
  const record =
    (name: string) =>
    (...args: unknown[]) => {
      calls.push(name);
      return args;
    };

  const ctx = {
    save: record('save'),
    restore: record('restore'),
    clip: record('clip'),
    fillRect: record('fillRect'),
    fillStyle: '',
    imageSmoothingEnabled: true,
    createPattern: () => ({}),
  } as unknown as CanvasRenderingContext2D;

  return { ctx, calls };
};

describe('drawing a region', () => {
  it('clips to bounds before anything else, so an outside cannot leak past them', () => {
    const { ctx, calls } = drawingCtx();

    region({
      inside: [],
      outside: [{ shape: 'circle', at: { x: 50, y: 50 }, radius: 20 }],
      bounds,
      fillColor: 'red',
    }).drawShape(ctx);

    expect(calls.indexOf('clip')).toBe(calls.indexOf('save') + 1);
    expect(calls.filter((call) => call === 'clip')).toHaveLength(2);
  });

  it('restores the context even when a member has no path to clip to', () => {
    const { ctx, calls } = drawingCtx();

    const noPath = region({
      // a line encloses nothing, so it can never be a member
      inside: [{ shape: 'line' } as never],
      outside: [],
      bounds,
      fillColor: 'red',
    });

    expect(() => noPath.drawShape(ctx)).toThrow();
    expect(calls).toContain('restore');
  });

  it('paints nothing, and builds nothing, without a fill', () => {
    const { ctx, calls } = drawingCtx();

    region({
      inside: [{ shape: 'circle', at: { x: 50, y: 50 }, radius: 20 }],
      outside: [],
      bounds,
    }).drawShape(ctx);

    expect(calls).toEqual([]);
  });
});
