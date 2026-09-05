import { BoundingBox, Coordinate } from '@core/utils/canvas/index';
import colors, { Color } from '@core/utils/colors';

import { ExampleNode } from './examples.ts';

export const NODE_RADIUS = 40;

/** ids carry the handover they belong to, so nothing keyed by id outlives its example */
export const nodeIdOf = (generation: number, index: number) =>
  `welcome/${generation}/node/${index}`;

export const edgeIdOf = (
  generation: number,
  { from, to }: { from: number; to: number },
) => `welcome/${generation}/edge/${from}-${to}`;

const WIPE: Color[] = [
  colors.PURPLE_500,
  colors.FUCHSIA_500,
  colors.PINK_500,
  colors.ROSE_500,
  colors.ORANGE_600,
  colors.ORANGE_400,
];

/** a node's color falls out of where it sits, spending the wipe left to right */
export const wipeColorsByNode = (nodes: readonly ExampleNode[]) => {
  const leftToRight = nodes
    .map((_, index) => index)
    .sort(
      (a, b) => nodes[a].at.x - nodes[b].at.x || nodes[a].at.y - nodes[b].at.y,
    );

  const byNode: Color[] = [];
  leftToRight.forEach(
    (node, rank) => (byNode[node] = WIPE[rank % WIPE.length]),
  );
  return byNode;
};

/** a point and how far what sits on it reaches, so unequal circles still center on what shows */
export type PlacementPoint = {
  at: Coordinate;
  reach: number;
};

export const boundingBoxOf = (
  points: readonly PlacementPoint[],
): BoundingBox => {
  const span = (axis: 'x' | 'y') => ({
    min: Math.min(...points.map(({ at, reach }) => at[axis] - reach)),
    max: Math.max(...points.map(({ at, reach }) => at[axis] + reach)),
  });

  const x = span('x');
  const y = span('y');
  return {
    at: { x: x.min, y: y.min },
    width: x.max - x.min,
    height: y.max - y.min,
  };
};

/** world units the scene sits below center, clearing the banner above it */
const VERTICAL_BIAS = 30;

/** centers the points on the canvas the rail leaves uncovered, answering in the order given */
export const resolvePositions = (
  points: readonly PlacementPoint[],
  viewport: BoundingBox,
  { reservedLeftPx, zoom }: { reservedLeftPx: number; zoom: number },
): Coordinate[] => {
  // a window too narrow to hold both would otherwise shove the scene off the right edge
  const reserved = Math.min(
    zoom > 0 ? reservedLeftPx / zoom : 0,
    viewport.width / 2,
  );

  const box = boundingBoxOf(points);

  const origin: Coordinate = {
    x:
      viewport.at.x +
      reserved +
      (viewport.width - reserved) / 2 -
      (box.at.x + box.width / 2),
    y:
      viewport.at.y +
      viewport.height / 2 +
      VERTICAL_BIAS -
      (box.at.y + box.height / 2),
  };

  return points.map(({ at }) => ({ x: origin.x + at.x, y: origin.y + at.y }));
};
