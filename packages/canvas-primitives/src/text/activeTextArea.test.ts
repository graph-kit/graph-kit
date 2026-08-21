import { nullThrows } from '@core/utils/assert';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { circle } from '../shapes/circle/index.ts';

// measuring wants a real 2d context, and these tests are about paint, not metrics
vi.mock('./getTextDimensions.ts', () => ({
  getTextDimensions: () => ({ width: 10, height: 10, ascent: 8, descent: 2 }),
}));

const recordingCtx = () => {
  const calls = new Map<string, ReturnType<typeof vi.fn>>();

  const target = {
    canvas: document.createElement('canvas'),
    // jsdom has no DOMMatrix, and only the identity parts are read
    getTransform: () => ({ a: 1, e: 0, f: 0 }),
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

const labelledCircle = (id: string) =>
  circle({
    at: { x: 0, y: 0 },
    radius: 10,
    textArea: { id, textBlock: { content: 'A' } },
  });

const startEdit = (id: string, ctx: CanvasRenderingContext2D) =>
  nullThrows(
    labelledCircle(id).startTextAreaEdit,
    'labelled shape can be edited',
  )(ctx, () => {});

const drawText = (id: string, ctx: CanvasRenderingContext2D) =>
  nullThrows(labelledCircle(id).drawText, 'labelled shape draws text')(ctx);

// the input sits outside jsdom's all-zero bounding rects, so this reads as a click away
const endEdit = () =>
  document.dispatchEvent(
    new MouseEvent('mousedown', { clientX: 999, clientY: 999 }),
  );

afterEach(endEdit);

describe('a text area being edited', () => {
  it('paints its text when no edit is engaged', () => {
    const { ctx, wasCalled } = recordingCtx();

    drawText('node-1', ctx);

    expect(wasCalled('fillText')).toBe(true);
  });

  it('stops painting once an edit is engaged', () => {
    const { ctx, wasCalled } = recordingCtx();

    startEdit('node-1', ctx);
    drawText('node-1', ctx);

    expect(wasCalled('fillText')).toBe(false);
  });

  it('leaves every other text area painting', () => {
    const { ctx, wasCalled } = recordingCtx();

    startEdit('node-1', ctx);
    drawText('node-2', ctx);

    expect(wasCalled('fillText')).toBe(true);
  });

  it('leaves the same id on another canvas painting', () => {
    const { ctx } = recordingCtx();
    const otherCanvas = recordingCtx();

    startEdit('node-1', ctx);
    drawText('node-1', otherCanvas.ctx);

    expect(otherCanvas.wasCalled('fillText')).toBe(true);
  });

  it('paints again once the edit ends', () => {
    const { ctx, wasCalled } = recordingCtx();

    startEdit('node-1', ctx);
    endEdit();
    drawText('node-1', ctx);

    expect(wasCalled('fillText')).toBe(true);
  });
});
