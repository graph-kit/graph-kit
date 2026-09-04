import { createAggregator } from '@canvas/primitives/aggregator/index';
import { createAnimatedShapes } from '@canvas/primitives/animation/index';
import type { Color } from '@core/utils/colors';
import { describe, expect, it, vi } from 'vitest';

import { OUTSIDE_ALL_SETS } from '../constants.ts';
import { getSectionKey } from '../sectionKey.ts';
import { useSetsTheme } from '../theme/useSetsTheme.ts';
import type { SetDefinition } from '../types.ts';
import { setsCanvasElements } from './canvasElements.ts';
import { setElementIdentity } from './elementIdentity.ts';

// measuring a label wants a real 2d context, and these tests are about hit order
vi.mock('@canvas/primitives/text/getTextDimensions', () => ({
  getTextDimensions: () => ({ width: 10, height: 10, ascent: 8, descent: 2 }),
}));

const bounds = { at: { x: -500, y: -500 }, width: 1000, height: 1000 };

const setAt = (
  id: string,
  x: number,
  y: number,
  radius: number,
): SetDefinition => ({
  id,
  label: id.toUpperCase(),
  display: { at: { x, y }, radius },
});

const build = (
  definitions: SetDefinition[],
  sectionKeyToColors = new Map<string, Color[]>(),
) => {
  const { shapes } = createAnimatedShapes();
  const theme = useSetsTheme();

  return setsCanvasElements({
    definitions,
    // the shape useSections produces: every group of two or more, then each on
    // its own, then the region outside them all
    sections: [
      ...(definitions.length > 1 ? [definitions.map(({ id }) => id)] : []),
      ...definitions.map(({ id }) => [id]),
      [OUTSIDE_ALL_SETS.identity],
    ],
    sectionKeyToColors,
    isSetFocused: () => false,
    bounds,
    cursorAt: { x: 0, y: 0 },
    shapes,
    resolveToken: theme._resolveToken,
  });
};

/** what the surface's hit test does, against the elements as they would be drawn */
const hitTest = (
  elements: ReturnType<typeof setsCanvasElements>,
  point: { x: number; y: number },
) => {
  const { aggregator, addTransformer, getCanvasElementsAtCoordinate, draw } =
    createAggregator({
      drawGroup: () => {},
      beginFrame: () => {},
      endFrame: () => {},
    });

  addTransformer((agg) => {
    agg.push(...elements);
    return agg;
  });

  // the aggregator only sorts on draw, and the hit test reads what was drawn
  draw(undefined as unknown as CanvasRenderingContext2D);
  void aggregator;

  return getCanvasElementsAtCoordinate(point).at(-1);
};

describe('the sets canvas elements', () => {
  it('paints only the sections a query selected', () => {
    const definitions = [setAt('a', 0, 0, 70)];
    const colors = new Map([[getSectionKey(['a']), ['#f00' as Color]]]);

    const sections = build(definitions, colors).filter(({ id }) =>
      id.startsWith('section/'),
    );

    expect(sections).toHaveLength(1);
    expect(sections[0].id).toBe(`section/${getSectionKey(['a'])}`);
  });

  it('leaves section fills untouchable, so the pointer reaches the set beneath', () => {
    const definitions = [setAt('a', 0, 0, 70)];
    const colors = new Map([[getSectionKey(['a']), ['#f00' as Color]]]);

    const elements = build(definitions, colors);

    for (const element of elements) {
      if (element.id.startsWith('section/')) {
        expect(element.paintOnly).toBe(true);
      }
    }

    expect(setElementIdentity(hitTest(elements, { x: 0, y: 0 }))).toEqual({
      setId: 'a',
      part: 'body',
    });
  });

  it('gives the resize band the pointer over the circle it straddles', () => {
    const elements = build([setAt('a', 0, 0, 70)]);

    expect(setElementIdentity(hitTest(elements, { x: 70, y: 0 }))).toEqual({
      setId: 'a',
      part: 'edge',
    });
    expect(setElementIdentity(hitTest(elements, { x: 40, y: 0 }))).toEqual({
      setId: 'a',
      part: 'body',
    });
  });

  it('gives the smallest circle the pointer when they are nested', () => {
    const elements = build([
      setAt('big', 0, 0, 200),
      setAt('small', 0, 0, 50),
      setAt('middle', 0, 0, 120),
    ]);

    expect(setElementIdentity(hitTest(elements, { x: 0, y: 0 }))?.setId).toBe(
      'small',
    );
    // outside the small one, the next smallest takes it
    expect(setElementIdentity(hitTest(elements, { x: 90, y: 0 }))?.setId).toBe(
      'middle',
    );
  });

  it('finds nothing where no set is', () => {
    const elements = build([setAt('a', 0, 0, 70)]);
    expect(hitTest(elements, { x: 400, y: 400 })).toBeUndefined();
  });

  it('paints the region outside every set from an empty inside', () => {
    const definitions = [setAt('a', 0, 0, 70)];
    const key = getSectionKey([OUTSIDE_ALL_SETS.identity]);
    const colors = new Map([[key, ['#f00' as Color]]]);

    const outsideAll = build(definitions, colors).find(
      ({ id }) => id === `section/${key}`,
    );

    expect(outsideAll).toBeDefined();
    // the whole viewport minus the one circle
    expect(outsideAll?.shape.hitbox({ x: 400, y: 400 })).toBe(true);
    expect(outsideAll?.shape.hitbox({ x: 0, y: 0 })).toBe(false);
  });
});
