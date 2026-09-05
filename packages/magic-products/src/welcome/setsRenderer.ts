import { CanvasElement } from '@canvas/primitives/aggregator/types';
import { RegionMember } from '@canvas/primitives/shapes/region/types';
import { BoundingBox, Coordinate } from '@core/utils/canvas/index';
import colors, { Color, ORANGE_700 } from '@core/utils/colors';
import { Graph } from '@magic/shared/graph';

import { SetsExample } from './examples.ts';

/*
  mirrored from the sets product's own presets rather than imported, so the welcome page
  does not reach into another product's internals. the numbers are its theme tokens:
  set.outline.width, set.label.size and section.stripeWidth, with the outline and label
  colors it resolves per preset. keep them in step with sets/theme/presets.ts
*/
const OUTLINE_WIDTH = 8;
const LABEL_SIZE = 24;
const STRIPE_WIDTH = 8;

const PALETTE = {
  light: { outline: colors.GRAY_800, label: colors.GRAY_900 },
  dark: { outline: colors.GRAY_900, label: colors.WHITE },
};

/**
 * the palette the product assigns a query's color from, in creation order. a region one
 * query selects hatches in a single color, which fills every pixel and so lands solid; a
 * region two of them both select hatches in both and comes out striped
 */
const QUERY_COLORS: Color[] = [
  colors.PURPLE_500,
  colors.ROSE_500,
  colors.ORANGE_500,
];

/** world units of slack around the circles for the box a region is taken within */
const BOUNDS_PADDING = 40;

/** the fill sits under the outlines it explains */
const REGION_PRIORITY = 0;
const CIRCLE_PRIORITY = 1;

/** an example with its circles already landed in world space */
export type PlacedSets = {
  example: SetsExample;
  centers: Coordinate[];
};

const boundsOf = ({ example, centers }: PlacedSets): BoundingBox => {
  const reach = (index: number) => example.sets[index].radius + BOUNDS_PADDING;

  const lows = centers.map(({ x, y }, index) => ({
    x: x - reach(index),
    y: y - reach(index),
  }));
  const highs = centers.map(({ x, y }, index) => ({
    x: x + reach(index),
    y: y + reach(index),
  }));

  const at = {
    x: Math.min(...lows.map(({ x }) => x)),
    y: Math.min(...lows.map(({ y }) => y)),
  };

  return {
    at,
    width: Math.max(...highs.map(({ x }) => x)) - at.x,
    height: Math.max(...highs.map(({ y }) => y)) - at.y,
  };
};

/** a region is named by the sets it is inside, so the labels sorted identify it */
const sectionKey = (labels: readonly string[]) => [...labels].sort().join('|');

/**
 * folds every query's result down to one entry per region, carrying the color of each
 * query that selected it in the order they were declared
 */
const paintedSections = ({ queries }: SetsExample) => {
  const byKey = new Map<string, { labels: string[]; colors: Color[] }>();

  for (const [index, query] of queries.entries()) {
    for (const section of query.sections) {
      const key = sectionKey(section);
      const entry = byKey.get(key) ?? { labels: [...section], colors: [] };
      entry.colors.push(QUERY_COLORS[index % QUERY_COLORS.length]);
      byKey.set(key, entry);
    }
  }

  return [...byKey.entries()].map(([key, entry]) => ({ key, ...entry }));
};

/**
 * draws the one product that is not a graph. the canvas graph has no nodes or edges while
 * this is up, so these elements are the whole picture rather than an overlay on one.
 *
 * everything is paint only: the pointer falls through to the canvas, so panning still works
 * over the diagram and nothing offers a drag the welcome page could not honor
 */
export const createSetsRenderer = (graph: Graph) => {
  let placed: PlacedSets | undefined;

  const palette = () =>
    PALETTE[graph.theme.activePresetName.value === 'dark' ? 'dark' : 'light'];

  const memberOf = (
    { example, centers }: PlacedSets,
    index: number,
  ): RegionMember => ({
    shape: 'circle',
    at: centers[index],
    radius: example.sets[index].radius,
  });

  const regionElements = (current: PlacedSets): CanvasElement[] => {
    const { example } = current;
    const bounds = boundsOf(current);

    return paintedSections(example).map(({ key, labels, colors: hatch }) => {
      const inside: RegionMember[] = [];
      const outside: RegionMember[] = [];

      for (const [at, { label }] of example.sets.entries()) {
        const side = labels.includes(label) ? inside : outside;
        side.push(memberOf(current, at));
      }

      const id = `welcome/sets/region/${key}`;
      return {
        id,
        priority: REGION_PRIORITY,
        paintOnly: true,
        shape: graph.surface.shapes.region({
          id,
          inside,
          outside,
          bounds,
          fillHatch: { colors: hatch, stripeWidth: STRIPE_WIDTH },
        }),
      };
    });
  };

  const circleElements = (current: PlacedSets): CanvasElement[] => {
    const { outline, label: labelColor } = palette();

    return current.example.sets.map(({ label }, index) => {
      const id = `welcome/sets/circle/${index}`;
      return {
        id,
        priority: CIRCLE_PRIORITY,
        paintOnly: true,
        shape: graph.surface.shapes.circle({
          id,
          at: current.centers[index],
          radius: current.example.sets[index].radius,
          stroke: { color: outline, lineWidth: OUTLINE_WIDTH },
          textArea: {
            id,
            textBlock: {
              content: label,
              fontSize: LABEL_SIZE,
              fontWeight: 'bold',
              color: labelColor,
            },
          },
        }),
      };
    });
  };

  graph.surface.aggregator.addTransformer((aggregator) => {
    if (!placed) return aggregator;
    aggregator.push(...regionElements(placed), ...circleElements(placed));
    return aggregator;
  });

  return {
    show: (next: PlacedSets) => (placed = next),
    clear: () => (placed = undefined),
  };
};
