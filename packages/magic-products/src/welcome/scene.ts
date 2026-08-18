import colors, { Color } from '@core/utils/colors';
import { ProductId } from '@magic/shared/product';

export type WelcomeNode = {
  productId: ProductId;
  /** canvas coordinates, placed by hand */
  position: { x: number; y: number };
  color: Color;
};

/**
 * one row per node on the landing page, in the order they animate in. placed by
 * hand rather than computed so any single node can be moved or recolored without
 * disturbing the others
 */
export const welcomeNodes = [
  {
    productId: 'avl-trees',
    position: { x: 960, y: 320 },
    color: colors.PURPLE_500,
  },
  {
    productId: 'traversals',
    position: { x: 960, y: 580 },
    color: colors.PINK_500,
  },
  {
    productId: 'path-finding',
    position: { x: 480, y: 580 },
    color: colors.ORANGE_500,
  },
  {
    productId: 'min-spanning-trees',
    position: { x: 480, y: 320 },
    color: colors.CYAN_500,
  },
  {
    productId: 'markov-chains',
    position: { x: 1280, y: 420 },
    color: colors.SKY_500,
  },
  {
    productId: 'sets',
    position: { x: 50, y: 420 },
    color: colors.SKY_500,
  },
] as const satisfies WelcomeNode[];

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
