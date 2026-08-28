import { BoundingBox, Coordinate } from '@core/utils/canvas/index';
import colors, { Color } from '@core/utils/colors';
import { ProductId } from '@magic/shared/product';

export type WelcomeNode = {
  productId: ProductId;
  /**
   * placement relative to the other nodes, in world units. the origin these are
   * written against is arbitrary, only the distances between them matter
   */
  offset: Coordinate;
  color: Color;
};

export const welcomeNodes = [
  {
    productId: 'avl-trees',
    offset: { x: 240, y: -130 },
    color: colors.PURPLE_500,
  },
  {
    productId: 'traversals',
    offset: { x: 240, y: 130 },
    color: colors.PINK_500,
  },
  {
    productId: 'path-finding',
    offset: { x: -240, y: 130 },
    color: colors.ORANGE_500,
  },
  {
    productId: 'min-spanning-trees',
    offset: { x: -240, y: -130 },
    color: colors.CYAN_500,
  },
  {
    productId: 'markov-chains',
    offset: { x: 560, y: -30 },
    color: colors.SKY_500,
  },
  {
    productId: 'sets',
    offset: { x: -670, y: -30 },
    color: colors.SKY_500,
  },
] as const satisfies WelcomeNode[];

const midpointOf = (values: number[]) =>
  (Math.min(...values) + Math.max(...values)) / 2;

/**
 * lands the scene's bounding box on the center of whatever the canvas is showing,
 * so the graph arrives centered at any window size
 */
export const resolvePositions = (viewport: BoundingBox) => {
  const offsets = welcomeNodes.map(({ offset }) => offset);

  const origin: Coordinate = {
    x:
      viewport.at.x +
      viewport.width / 2 -
      midpointOf(offsets.map(({ x }) => x)),
    y:
      viewport.at.y +
      viewport.height / 2 -
      midpointOf(offsets.map(({ y }) => y)),
  };

  return welcomeNodes.map(({ productId, offset }) => ({
    productId,
    position: { x: origin.x + offset.x, y: origin.y + offset.y },
  }));
};

/** only the products the scene places, so no edge can name a node that is absent */
type WelcomeProductId = (typeof welcomeNodes)[number]['productId'];

/** [source, target] pairs, drawn once every node has animated in */
export const edges: [WelcomeProductId, WelcomeProductId][] = [
  ['avl-trees', 'markov-chains'],
  ['markov-chains', 'avl-trees'],
  ['avl-trees', 'min-spanning-trees'],
  ['markov-chains', 'traversals'],
  ['min-spanning-trees', 'path-finding'],
  ['path-finding', 'traversals'],
  ['traversals', 'path-finding'],
  ['traversals', 'avl-trees'],
  ['min-spanning-trees', 'sets'],
];

export const NODE_RADIUS = 45;

export const nodeIdOf = (productId: ProductId) => `welcome/node/${productId}`;

export const edgeIdOf = (index: number) => `welcome/edge/${index}`;
