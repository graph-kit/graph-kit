import { CanvasElement } from '@canvas/primitives/aggregator/types';
import { RegionMember } from '@canvas/primitives/shapes/region/types';
import { Coordinate } from '@core/utils/canvas/index';
import colors, { Color } from '@core/utils/colors';
import { Graph } from '@magic/shared/graph';

import { SetsExample } from './examples.ts';
import { boundingBoxOf } from './scene.ts';

/** the sets product's own theme tokens; keep them in step with sets/theme/presets.ts */
const OUTLINE_WIDTH = 8;
const LABEL_SIZE = 24;
const STRIPE_WIDTH = 8;

const INK = {
  light: { outline: colors.GRAY_800, label: colors.GRAY_900 },
  dark: { outline: colors.GRAY_900, label: colors.WHITE },
};

/** one query hatches in a single color, which fills solid; two of them come out striped */
const QUERY_COLORS: Color[] = [
  colors.PURPLE_500,
  colors.ROSE_500,
  colors.ORANGE_500,
];

const BOUNDS_PADDING = 40;

/** the fills sit under the outlines they explain */
const REGION_PRIORITY = 0;
const CIRCLE_PRIORITY = 1;

/** the circle members a region is composed from, narrowed so their geometry is readable */
type SetCircle = Extract<RegionMember, { shape: 'circle' }>;

export type PlacedSets = {
  example: SetsExample;
  centers: Coordinate[];
};

const sectionKey = (labels: readonly string[]) => [...labels].sort().join('|');

/** one entry per region, carrying the color of every query that selected it */
const paintedSections = ({ queries }: SetsExample) => {
  const byKey = new Map<string, { labels: string[]; colors: Color[] }>();

  for (const [index, query] of queries.entries()) {
    for (const section of query.sections) {
      const entry = byKey.get(sectionKey(section)) ?? {
        labels: [...section],
        colors: [],
      };
      entry.colors.push(QUERY_COLORS[index % QUERY_COLORS.length]);
      byKey.set(sectionKey(section), entry);
    }
  }

  return [...byKey.entries()].map(([key, entry]) => ({ key, ...entry }));
};

/**
 * draws the one product that is not a graph. paint only throughout, so the pointer falls
 * through to the canvas and panning still works over the diagram
 */
export const createSetsRenderer = (graph: Graph) => {
  let placed: PlacedSets | undefined;

  const membersOf = ({ example, centers }: PlacedSets): SetCircle[] =>
    centers.map((at, index) => ({
      shape: 'circle',
      at,
      radius: example.sets[index].radius,
    }));

  const regionElements = (current: PlacedSets): CanvasElement[] => {
    const members = membersOf(current);
    const bounds = boundingBoxOf(
      members.map(({ at, radius }) => ({ at, reach: radius + BOUNDS_PADDING })),
    );

    return paintedSections(current.example).map(({ key, labels, colors }) => {
      const id = `welcome/sets/region/${key}`;
      const selected = current.example.sets.map(({ label }) =>
        labels.includes(label),
      );

      return {
        id,
        priority: REGION_PRIORITY,
        paintOnly: true,
        shape: graph.surface.shapes.region({
          id,
          inside: members.filter((_, index) => selected[index]),
          outside: members.filter((_, index) => !selected[index]),
          bounds,
          fillHatch: { colors, stripeWidth: STRIPE_WIDTH },
        }),
      };
    });
  };

  const circleElements = (current: PlacedSets): CanvasElement[] => {
    const { outline, label: labelColor } =
      INK[graph.theme.activePresetName.value === 'dark' ? 'dark' : 'light'];

    return membersOf(current).map((member, index) => {
      const id = `welcome/sets/circle/${index}`;
      return {
        id,
        priority: CIRCLE_PRIORITY,
        paintOnly: true,
        shape: graph.surface.shapes.circle({
          id,
          at: member.at,
          radius: member.radius,
          stroke: { color: outline, lineWidth: OUTLINE_WIDTH },
          textArea: {
            id,
            textBlock: {
              content: current.example.sets[index].label,
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
