import type { Annotation } from '@core/annotations/index';
import { compressToEncodedURIComponent } from 'lz-string';
import { describe, expect, it } from 'vitest';

import { QUERY_COLORS } from '../constants.ts';
import { setsTransitCompression } from './transit-compression.ts';
import type { SetsTransitPayload } from './transit.ts';

const { compress, decompress } = setsTransitCompression;

const stroke = (id: string): Annotation => ({
  id,
  type: 'draw',
  points: [
    { x: 0, y: 0 },
    { x: 10, y: 12 },
  ],
  fillColor: '#ff0000',
  brushWeight: 4,
});

const payload = (
  overrides: Partial<SetsTransitPayload> = {},
): SetsTransitPayload => ({
  sets: [
    { label: 'A', x: 10, y: 20, radius: 70 },
    { label: 'B', x: -30, y: 40, radius: 55 },
  ],
  queries: [
    { latexQueryString: 'A \\cup B', hidden: false, color: QUERY_COLORS[0] },
    { latexQueryString: 'A \\cap B', hidden: true, color: QUERY_COLORS[2] },
  ],
  annotations: [stroke('one')],
  camera: { panX: 12.34, panY: -56.78, zoom: 1.5 },
  ...overrides,
});

const roundTrip = (state: SetsTransitPayload) => decompress(compress(state));

/*
  a stroke's id is session local: the annotations codec mints new ones on the way back,
  so a link carries the drawing rather than the identity of each stroke in it
*/
const withoutIds = (annotations: Annotation[]) =>
  annotations.map(({ id, ...stroke }) => stroke);

describe('setsTransitCompression', () => {
  it('carries a whole canvas back unchanged', () => {
    const restored = roundTrip(payload());
    const expected = payload();

    expect(withoutIds(restored.annotations)).toEqual(
      withoutIds(expected.annotations),
    );
    expect({ ...restored, annotations: [] }).toEqual({
      ...expected,
      annotations: [],
    });
  });

  it('keeps a query readable through every separator the format uses', () => {
    // a mathfield takes all three, so none of them can be trusted to delimit
    const latexQueryString = 'A|B;C,D';

    const restored = roundTrip(
      payload({
        queries: [{ latexQueryString, hidden: false, color: QUERY_COLORS[1] }],
      }),
    );

    expect(restored.queries).toEqual([
      { latexQueryString, hidden: false, color: QUERY_COLORS[1] },
    ]);
  });

  it('leaves the annotations section its own separators', () => {
    const annotations = [stroke('one'), stroke('two')];

    expect(withoutIds(roundTrip(payload({ annotations })).annotations)).toEqual(
      withoutIds(annotations),
    );
  });

  it('carries an empty canvas', () => {
    const empty = payload({ sets: [], queries: [], annotations: [] });

    expect(roundTrip(empty)).toEqual(empty);
  });

  it('rounds geometry to whole units and the camera to two places', () => {
    const restored = roundTrip(
      payload({
        sets: [{ label: 'A', x: 10.6, y: 20.4, radius: 70.5 }],
        camera: { panX: 1.234_5, panY: 2.999, zoom: 0.333_33 },
      }),
    );

    expect(restored.sets).toEqual([{ label: 'A', x: 11, y: 20, radius: 71 }]);
    expect(restored.camera).toEqual({ panX: 1.23, panY: 3, zoom: 0.33 });
  });

  it('refuses a payload it cannot read the version of', () => {
    expect(() => decompress('9|0,0,1|||')).toThrow(/version/);
  });

  it('refuses a payload cut short', () => {
    expect(() => decompress('1|0,0,1')).toThrow(/cut short/);
  });

  it('fits a canvas with annotations inside a link', () => {
    // the budget link sharing enforces, see MAX_PAYLOAD_CHARS
    const scribble = (id: string): Annotation => ({
      ...stroke(id),
      points: Array.from({ length: 200 }, (_, index) => ({
        x: index * 1.7,
        y: Math.sin(index) * 40,
      })),
    });

    const busy = payload({
      annotations: [scribble('one'), scribble('two'), scribble('three')],
    });

    // the budget is measured on what the url actually carries, see getLinkPayload
    const asLink = (text: string) => compressToEncodedURIComponent(text).length;

    expect(asLink(compress(busy))).toBeLessThan(2_600);
    // the same canvas has no chance through the json fallback, which is why this exists
    expect(asLink(JSON.stringify(busy))).toBeGreaterThan(2_600);
  });
});
