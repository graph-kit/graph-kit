import { BoundingBox, Coordinate } from '@core/utils/canvas/index';
import colors, { Color } from '@core/utils/colors';
import { getRandomElement } from '@core/utils/random';
import { ProductId } from '@magic/shared/product';

import {
  WelcomeArrangement,
  WelcomeProductId,
  welcomeArrangements,
} from './arrangements.ts';

export const pickArrangement = () => getRandomElement(welcomeArrangements);

const entriesOf = ({ nodes }: WelcomeArrangement) =>
  Object.entries(nodes) as [WelcomeProductId, Coordinate][];

/** handed out left to right, looping once the arrangement outruns it */
const WIPE: Color[] = [
  colors.PURPLE_500,
  colors.FUCHSIA_500,
  colors.PINK_500,
  colors.ROSE_500,
  colors.ORANGE_600,
  colors.ORANGE_400,
];

/**
 * spends the wipe across the arrangement, so a node's color falls out of where it
 * sits horizontally rather than being written down per layout
 */
export const resolveColors = (arrangement: WelcomeArrangement) =>
  entriesOf(arrangement)
    .sort(
      ([, previous], [, next]) => previous.x - next.x || previous.y - next.y,
    )
    .map(([productId], index) => ({
      productId,
      color: WIPE[index % WIPE.length],
    }));

const midpointOf = (values: number[]) =>
  (Math.min(...values) + Math.max(...values)) / 2;

/** world units the scene sits below the viewport center, clearing the banner above it */
const VERTICAL_BIAS = 30;

/**
 * lands the arrangement's bounding box on the center of whatever the canvas is
 * showing, so the graph arrives centered at any window size
 */
export const resolvePositions = (
  arrangement: WelcomeArrangement,
  viewport: BoundingBox,
) => {
  const entries = entriesOf(arrangement);
  const offsets = entries.map(([, offset]) => offset);

  const origin: Coordinate = {
    x:
      viewport.at.x +
      viewport.width / 2 -
      midpointOf(offsets.map(({ x }) => x)),
    y:
      viewport.at.y +
      viewport.height / 2 +
      VERTICAL_BIAS -
      midpointOf(offsets.map(({ y }) => y)),
  };

  return entries.map(([productId, offset]) => ({
    productId,
    position: { x: origin.x + offset.x, y: origin.y + offset.y },
  }));
};

export const NODE_RADIUS = 45;

export const nodeIdOf = (productId: ProductId) => `welcome/node/${productId}`;

export const edgeIdOf = (index: number) => `welcome/edge/${index}`;
