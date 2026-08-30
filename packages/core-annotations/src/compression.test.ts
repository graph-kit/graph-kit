import { describe, expect, it } from 'vitest';

import { compressAnnotations, decompressAnnotations } from './compression.ts';
import type { Annotation } from './types.ts';

const stroke = (annotation: Partial<Annotation> = {}): Annotation => ({
  id: 'seed',
  type: 'draw',
  points: [
    { x: 0, y: 0 },
    { x: 10, y: 12 },
  ],
  fillColor: '#ff0000',
  brushWeight: 4,
  ...annotation,
});

const roundTrip = (annotations: Annotation[]) =>
  decompressAnnotations(compressAnnotations(annotations));

/** everything but the id, which is minted fresh on the way back */
const withoutIds = (annotations: Annotation[]) =>
  annotations.map(({ id, ...rest }) => rest);

describe('compressAnnotations', () => {
  it('round trips a set of strokes', () => {
    const annotations = [
      stroke(),
      stroke({ fillColor: '#00ff00', brushWeight: 12 }),
      stroke({ type: 'erase' }),
    ];

    expect(withoutIds(roundTrip(annotations))).toEqual(withoutIds(annotations));
  });

  it('round trips a stroke with no brush weight or color', () => {
    const annotations = [
      stroke({ brushWeight: undefined, fillColor: undefined }),
    ];

    const [result] = roundTrip(annotations);
    expect(result?.brushWeight).toBeUndefined();
    expect(result?.fillColor).toBeUndefined();
    expect(result?.points).toEqual(annotations[0]?.points);
  });

  it('round trips an empty set', () => {
    expect(roundTrip([])).toEqual([]);
  });

  it('round trips a stroke with a single point', () => {
    const annotations = [stroke({ points: [{ x: -40, y: 900 }] })];
    expect(roundTrip(annotations)[0]?.points).toEqual([{ x: -40, y: 900 }]);
  });

  it('keeps colors apart when strokes do not share them', () => {
    const annotations = [
      stroke({ fillColor: '#111111' }),
      stroke({ fillColor: '#222222' }),
      stroke({ fillColor: '#111111' }),
    ];

    expect(roundTrip(annotations).map((one) => one.fillColor)).toEqual([
      '#111111',
      '#222222',
      '#111111',
    ]);
  });

  it('lists a shared color once', () => {
    const shared = compressAnnotations([
      stroke({ fillColor: '#abcdef' }),
      stroke({ fillColor: '#abcdef' }),
    ]);

    expect(shared.split('abcdef').length - 1).toBe(1);
  });

  it('rounds points to whole units', () => {
    const annotations = [
      stroke({
        points: [
          { x: 10.4, y: 12.6 },
          { x: 20.5, y: 30.2 },
        ],
      }),
    ];

    expect(roundTrip(annotations)[0]?.points).toEqual([
      { x: 10, y: 13 },
      { x: 21, y: 30 },
    ]);
  });

  it('drops points a paused pointer repeated', () => {
    const annotations = [
      stroke({
        points: [
          { x: 5, y: 5 },
          { x: 5.1, y: 5.2 },
          { x: 5, y: 5 },
          { x: 40, y: 40 },
        ],
      }),
    ];

    expect(roundTrip(annotations)[0]?.points).toEqual([
      { x: 5, y: 5 },
      { x: 40, y: 40 },
    ]);
  });

  it('mints a fresh id for every stroke', () => {
    const ids = roundTrip([stroke(), stroke(), stroke()]).map((one) => one.id);

    expect(new Set(ids).size).toBe(3);
    expect(ids).not.toContain('seed');
  });

  it('is far smaller than the same strokes as json', () => {
    const points = Array.from({ length: 200 }, (_, i) => ({
      x: 100 + i * 1.37,
      y: 250 - i * 0.82,
    }));
    const annotations = [stroke({ points }), stroke({ points })];

    const compressed = compressAnnotations(annotations).length;
    const asJson = JSON.stringify(annotations).length;

    expect(compressed).toBeLessThan(asJson / 4);
  });
});

describe('decompressAnnotations', () => {
  it('refuses a version it does not know', () => {
    expect(() => decompressAnnotations('9|#ff0000|d,0,4,0,0')).toThrow();
  });

  it('refuses a stroke type it does not know', () => {
    expect(() => decompressAnnotations('1|#ff0000|z,0,4,0,0')).toThrow();
  });

  it('refuses a point missing half of itself', () => {
    expect(() => decompressAnnotations('1|#ff0000|d,0,4,0,0,7')).toThrow();
  });

  it('refuses a color index nothing sits at', () => {
    expect(() => decompressAnnotations('1|#ff0000|d,4,4,0,0')).toThrow();
  });
});
