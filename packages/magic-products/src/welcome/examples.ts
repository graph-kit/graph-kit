import { Coordinate } from '@core/utils/canvas/index';
import { ProductId } from '@magic/shared/product';

/**
 * every product the canvas can stand up an example of. sets is absent until we work out
 * what a set drawing looks like here, so no card can name an example that is missing
 */
export type ExampleProductId = Exclude<ProductId, 'dev' | 'welcome' | 'sets'>;

export type ExampleNode = {
  /** what the node reads as, so an AVL example can hold values and a chain can hold states */
  label: string;
  /**
   * placement relative to the other nodes, in world units. the origin these are written
   * against is arbitrary, only the distances between them matter
   */
  at: Coordinate;
};

export type ExampleEdge = {
  /** index into {@link ProductExample.nodes} */
  from: number;
  /** index into {@link ProductExample.nodes} */
  to: number;
  /** anything `Fraction` takes, so a chain can carry `'1/2'` and a path can carry `7` */
  weight?: string | number;
  /**
   * drawn faded, for an edge the product's own answer leaves out. an MST example ghosts
   * everything outside the tree so the tree itself is what reads
   */
  ghosted?: boolean;
};

export type ProductExample = {
  /**
   * whether edges are drawn with arrowheads. the canvas graph itself is directed no matter
   * what, since directedness is fixed at construction, so this is the rendering alone
   */
  directed: boolean;
  /** whether edges show their weight */
  weighted: boolean;
  nodes: ExampleNode[];
  edges: ExampleEdge[];
};

/** the graph each product greets you with, laid out the way that product would */
export const productExamples: Record<ExampleProductId, ProductExample> = {
  traversals: {
    directed: true,
    weighted: false,
    // laid out in layers running left to right, which is the order a breadth first sweep
    // reaches them in, and every edge points to the next layer so none of them cross.
    // E and G are reachable two and three ways over, so the visited set does real work,
    // and E back to B is the one cycle
    nodes: [
      { label: 'A', at: { x: -340, y: 0 } },
      { label: 'B', at: { x: -110, y: -170 } },
      { label: 'C', at: { x: -110, y: 170 } },
      { label: 'D', at: { x: 110, y: -240 } },
      { label: 'E', at: { x: 110, y: 0 } },
      { label: 'F', at: { x: 110, y: 240 } },
      { label: 'G', at: { x: 340, y: 0 } },
    ],
    edges: [
      { from: 0, to: 1 },
      { from: 0, to: 2 },
      { from: 1, to: 3 },
      { from: 1, to: 4 },
      { from: 2, to: 4 },
      { from: 2, to: 5 },
      { from: 3, to: 6 },
      { from: 4, to: 6 },
      { from: 5, to: 6 },
      { from: 4, to: 1 },
    ],
  },

  'path-finding': {
    directed: true,
    weighted: true,
    nodes: [
      { label: 'S', at: { x: -350, y: 0 } },
      { label: 'A', at: { x: -140, y: -180 } },
      { label: 'B', at: { x: -140, y: 180 } },
      { label: 'C', at: { x: 140, y: -180 } },
      { label: 'D', at: { x: 140, y: 180 } },
      { label: 'T', at: { x: 350, y: 0 } },
    ],
    edges: [
      { from: 0, to: 1, weight: 4 },
      { from: 0, to: 2, weight: 2 },
      { from: 2, to: 1, weight: 1 },
      { from: 1, to: 3, weight: 3 },
      { from: 2, to: 4, weight: 7 },
      { from: 3, to: 4, weight: 1 },
      { from: 3, to: 5, weight: 2 },
      { from: 4, to: 5, weight: 3 },
    ],
  },

  'min-spanning-trees': {
    directed: false,
    weighted: true,
    nodes: [
      { label: 'A', at: { x: -350, y: -160 } },
      { label: 'B', at: { x: -60, y: -230 } },
      { label: 'C', at: { x: 240, y: -150 } },
      { label: 'D', at: { x: -340, y: 170 } },
      { label: 'E', at: { x: -30, y: 50 } },
      { label: 'F', at: { x: 300, y: 180 } },
    ],
    // every weight is distinct, so there is exactly one minimum spanning tree to show:
    // A-B, D-E, C-E, B-E and C-F, costing 21. the three it passes over are ghosted
    edges: [
      { from: 0, to: 1, weight: 4 },
      { from: 0, to: 3, weight: 6, ghosted: true },
      { from: 1, to: 2, weight: 8, ghosted: true },
      { from: 1, to: 4, weight: 5 },
      { from: 2, to: 4, weight: 2 },
      { from: 2, to: 5, weight: 7 },
      { from: 3, to: 4, weight: 3 },
      { from: 4, to: 5, weight: 9, ghosted: true },
    ],
  },

  'avl-trees': {
    directed: false,
    weighted: false,
    nodes: [
      { label: '30', at: { x: 0, y: -200 } },
      { label: '20', at: { x: -240, y: -10 } },
      { label: '40', at: { x: 240, y: -10 } },
      { label: '10', at: { x: -360, y: 190 } },
      { label: '25', at: { x: -120, y: 190 } },
      { label: '35', at: { x: 120, y: 190 } },
      { label: '50', at: { x: 360, y: 190 } },
    ],
    edges: [
      { from: 0, to: 1 },
      { from: 0, to: 2 },
      { from: 1, to: 3 },
      { from: 1, to: 4 },
      { from: 2, to: 5 },
      { from: 2, to: 6 },
    ],
  },

  'markov-chains': {
    directed: true,
    weighted: true,
    // every state's outbound weights sum to one, the way a valid chain reads in the product
    nodes: [
      { label: 'A', at: { x: -280, y: -170 } },
      { label: 'B', at: { x: 280, y: -170 } },
      { label: 'C', at: { x: 280, y: 170 } },
      { label: 'D', at: { x: -280, y: 170 } },
    ],
    edges: [
      { from: 0, to: 1, weight: '1/2' },
      { from: 0, to: 3, weight: '1/2' },
      { from: 1, to: 0, weight: '1/4' },
      { from: 1, to: 2, weight: '3/4' },
      { from: 2, to: 2, weight: '1/3' },
      { from: 2, to: 3, weight: '2/3' },
      { from: 3, to: 0, weight: 1 },
    ],
  },
};

/** what the canvas stands up before anyone has pointed at a card */
export const DEFAULT_EXAMPLE: ExampleProductId = 'traversals';

/** narrows a product id off a manifest, which is only ever typed as a string */
export const isExampleProductId = (
  productId: string,
): productId is ExampleProductId => productId in productExamples;
