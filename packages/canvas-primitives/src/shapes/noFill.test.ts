import { nullThrows } from '@core/utils/assert';
import { describe, expect, it, vi } from 'vitest';

import { arrow } from './arrow/index.ts';
import { circle } from './circle/index.ts';
import { cross } from './cross/index.ts';
import { ellipse } from './ellipse/index.ts';
import { line } from './line/index.ts';
import { rect } from './rect/index.ts';
import { region } from './region/index.ts';
import { scribble } from './scribble/index.ts';
import { square } from './square/index.ts';
import { star } from './star/index.ts';
import { triangle } from './triangle/index.ts';
import { uturn } from './uturn/index.ts';

// measuring wants a real 2d context, and these tests are about paint, not metrics
vi.mock('../text/getTextDimensions.ts', () => ({
  getTextDimensions: () => ({ width: 10, height: 10, ascent: 8, descent: 2 }),
}));

vi.mock('@core/utils/canvas/index', () => ({
  getClientCoordinates: vi.fn(),
  getCtx: vi.fn(() => ({
    measureText: vi.fn(() => ({
      width: 0,
      actualBoundingBoxAscent: 0,
      actualBoundingBoxDescent: 0,
    })),
    textAlign: '',
    textBaseline: '',
    font: '',
    fillStyle: '',
    fillText: vi.fn(),
  })),
}));

/**
 * records every method a shape calls on it, so a draw can be asserted against
 * without a real canvas. property writes such as `fillStyle` are accepted and
 * ignored, since what matters here is whether paint was committed
 */
const recordingCtx = () => {
  const calls = new Map<string, ReturnType<typeof vi.fn>>();

  const target = {
    measureText: () => ({
      width: 0,
      actualBoundingBoxAscent: 0,
      actualBoundingBoxDescent: 0,
    }),
    createLinearGradient: () => ({ addColorStop: () => {} }),
    canvas: { width: 100, height: 100 },
    // DOMMatrix is not in this environment, and an identity transform is all
    // a draw reads off one
    getTransform: () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }),
  } as Record<string, unknown>;

  const ctx = new Proxy(target, {
    get(_, prop: string) {
      if (prop in target) return target[prop];
      const existing = calls.get(prop);
      if (existing) return existing;
      const fn = vi.fn();
      calls.set(prop, fn);
      return fn;
    },
    set: () => true,
  }) as unknown as CanvasRenderingContext2D;

  return {
    ctx,
    wasCalled: (method: string) =>
      (calls.get(method)?.mock.calls.length ?? 0) > 0,
  };
};

const at = { x: 0, y: 0 };

/**
 * every shape that treats `fillColor` as paint, built with the minimum its
 * schema requires and deliberately no color
 */
const colorlessShapes = {
  arrow: () => arrow({ start: at, end: { x: 50, y: 50 } }),
  circle: () => circle({ at, radius: 10 }),
  cross: () => cross({ at, size: 10 }),
  ellipse: () => ellipse({ at, radiusX: 10, radiusY: 20 }),
  line: () => line({ start: at, end: { x: 50, y: 50 } }),
  rect: () => rect({ at, width: 10, height: 10 }),
  roundedRect: () => rect({ at, width: 10, height: 10, borderRadius: 4 }),
  region: () =>
    region({
      inside: [{ shape: 'circle', at, radius: 10 }],
      outside: [],
      bounds: { at, width: 10, height: 10 },
    }),
  scribble: () => scribble({ type: 'draw', points: [at, { x: 5, y: 5 }] }),
  square: () => square({ at, size: 10 }),
  star: () => star({ at, innerRadius: 5, outerRadius: 10 }),
  triangle: () =>
    triangle({ pointA: at, pointB: { x: 5, y: 0 }, pointC: { x: 0, y: 5 } }),
  uturn: () =>
    uturn({ at, spacing: 10, upDistance: 20, downDistance: 20, rotation: 0 }),
};

describe('a shape with no fillColor', () => {
  for (const [name, build] of Object.entries(colorlessShapes)) {
    it(`does not paint anything for ${name}`, () => {
      const { ctx, wasCalled } = recordingCtx();

      build().drawShape(ctx);

      expect(wasCalled('fill')).toBe(false);
      expect(wasCalled('stroke')).toBe(false);
      expect(wasCalled('fillRect')).toBe(false);
    });
  }
});

describe('a shape given a fillColor', () => {
  it('still paints', () => {
    const { ctx, wasCalled } = recordingCtx();

    circle({ at, radius: 10, fillColor: 'red' }).drawShape(ctx);

    expect(wasCalled('fill')).toBe(true);
  });

  it('paints a stroke-only shape from its stroke alone', () => {
    const { ctx, wasCalled } = recordingCtx();

    circle({
      at,
      radius: 10,
      stroke: { color: 'red', lineWidth: 2 },
    }).drawShape(ctx);

    expect(wasCalled('fill')).toBe(false);
    expect(wasCalled('stroke')).toBe(true);
  });
});

const textBlock = { content: 'A' };

const labelledCircle = (color?: string) =>
  circle({
    at,
    radius: 10,
    textArea: { id: 'labelled-circle', color, textBlock },
  });

const drawMatte = (shape: ReturnType<typeof labelledCircle>) => {
  const { ctx, wasCalled } = recordingCtx();
  nullThrows(shape.drawTextAreaMatte, 'labelled shape has a matte')(ctx);
  return wasCalled;
};

describe('a text area matte', () => {
  it('is not painted when no color is given', () => {
    expect(drawMatte(labelledCircle())('fill')).toBe(false);
  });

  it('is painted when a color is given', () => {
    expect(drawMatte(labelledCircle('white'))('fill')).toBe(true);
  });

  it('punches a hole rather than painting when the color is "none"', () => {
    const shape = labelledCircle('none');

    expect(drawMatte(shape)('fill')).toBe(false);
    expect(shape.drawTextAreaHole).toBeDefined();
  });
});
