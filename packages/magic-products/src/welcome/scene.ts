import { BoundingBox, Coordinate } from '@core/utils/canvas/index';
import colors, { Color } from '@core/utils/colors';

import { ProductExample } from './examples.ts';

export const NODE_RADIUS = 40;

/**
 * ids carry the handover they belong to, so an example never inherits a slot the one before
 * it was using and no store keyed by id can carry anything across the switch
 */
export const nodeIdOf = (generation: number, index: number) =>
  `welcome/${generation}/node/${index}`;

export const edgeIdOf = (
  generation: number,
  { from, to }: { from: number; to: number },
) => `welcome/${generation}/edge/${from}-${to}`;

/** handed out left to right, looping once an example outruns it */
const WIPE: Color[] = [
  colors.PURPLE_500,
  colors.FUCHSIA_500,
  colors.PINK_500,
  colors.ROSE_500,
  colors.ORANGE_600,
  colors.ORANGE_400,
];

/**
 * spends the wipe across the example, so a node's color falls out of where it sits
 * horizontally rather than being written down per product
 */
export const resolveColors = ({ nodes }: ProductExample) =>
  nodes
    .map((node, index) => ({ node, index }))
    .sort(({ node: a }, { node: b }) => a.at.x - b.at.x || a.at.y - b.at.y)
    .map(({ index }, rank) => ({ index, color: WIPE[rank % WIPE.length] }));

const midpointOf = (values: number[]) =>
  (Math.min(...values) + Math.max(...values)) / 2;

/** world units the scene sits below the viewport center, clearing the banner above it */
const VERTICAL_BIAS = 30;

/**
 * lands the example's bounding box on the center of the canvas the rail is not covering, so
 * the graph arrives centered in the room it actually has at any window size
 */
export const resolvePositions = (
  example: ProductExample,
  viewport: BoundingBox,
  { reservedLeftPx, zoom }: { reservedLeftPx: number; zoom: number },
) => {
  const offsets = example.nodes.map(({ at }) => at);

  // on a window too narrow to hold both, honoring the rail in full would shove the graph
  // clean off the right edge, so it never gives up more than half of what it can see
  const reserved = Math.min(
    zoom > 0 ? reservedLeftPx / zoom : 0,
    viewport.width / 2,
  );

  const origin: Coordinate = {
    x:
      viewport.at.x +
      reserved +
      (viewport.width - reserved) / 2 -
      midpointOf(offsets.map(({ x }) => x)),
    y:
      viewport.at.y +
      viewport.height / 2 +
      VERTICAL_BIAS -
      midpointOf(offsets.map(({ y }) => y)),
  };

  return example.nodes.map(({ at }, index) => ({
    index,
    position: { x: origin.x + at.x, y: origin.y + at.y },
  }));
};
