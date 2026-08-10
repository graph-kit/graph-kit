import colors, { Color } from '@core/utils/colors';
import { ProductId } from '@magic/shared/product';

export type WelcomeNode = {
  productId: ProductId;
  /** short form of the product name, since a full one cannot fit inside a node */
  label: string;
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
    label: 'AVL',
    position: { x: 960, y: 320 },
    color: colors.PURPLE_500,
  },
  {
    productId: 'traversals',
    label: 'TRV',
    position: { x: 960, y: 580 },
    color: colors.PINK_500,
  },
  {
    productId: 'path-finding',
    label: 'PTH',
    position: { x: 480, y: 580 },
    color: colors.ORANGE_500,
  },
  {
    productId: 'min-spanning-trees',
    label: 'MST',
    position: { x: 480, y: 320 },
    color: colors.CYAN_500,
  },
  {
    productId: 'markov-chains',
    label: 'MKV',
    position: { x: 1280, y: 420 },
    color: colors.SKY_500,
  },
  {
    productId: 'sets',
    label: 'SET',
    position: { x: 50, y: 420 },
    color: colors.SKY_500,
  },
] as const satisfies WelcomeNode[];

type Label = (typeof welcomeNodes)[number]['label'];

/** [source, target] pairs, drawn once every node has animated in */
export const edges: [Label, Label][] = [
  ['AVL', 'MKV'],
  ['MKV', 'AVL'],
  ['AVL', 'MST'],
  ['MKV', 'TRV'],
  ['MST', 'PTH'],
  ['PTH', 'TRV'],
  ['TRV', 'PTH'],
  ['TRV', 'AVL'],
  ['MST', 'SET'],
];

export const NODE_RADIUS = 45;

export const nodeIdOf = (productId: ProductId) => `welcome/node/${productId}`;

export const edgeIdOf = (index: number) => `welcome/edge/${index}`;

const productIdByLabel = Object.fromEntries(
  welcomeNodes.map(({ label, productId }) => [label, productId]),
) as Record<Label, ProductId>;

export const nodeIdOfLabel = (label: Label) =>
  nodeIdOf(productIdByLabel[label]);
