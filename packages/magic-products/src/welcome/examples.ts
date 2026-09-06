import { nullThrows } from '@core/utils/assert';
import { Coordinate } from '@core/utils/canvas/index';
import { ProductCard, ProductId, products } from '@magic/shared/product';

export type ExampleProductId = Exclude<ProductId, 'dev' | 'welcome'>;

export type ExampleNode = {
  label: string;
  // relative distance, not absolute position
  at: Coordinate;
};

export type ExampleEdge = {
  from: number;
  to: number;
  weight?: string | number;
  ghosted?: boolean;
};

export type GraphExample = {
  kind: 'graph';
  directed: boolean;
  weighted: boolean;
  nodes: ExampleNode[];
  edges: ExampleEdge[];
};

export type ExampleSet = {
  label: string;
  at: Coordinate;
  radius: number;
};

export type ExampleQuery = {
  selects: string;
  sections: string[][];
};

export type SetsExample = {
  kind: 'sets';
  sets: ExampleSet[];
  queries: ExampleQuery[];
};

export type ProductExample = GraphExample | SetsExample;

export const productExamples: Record<ExampleProductId, ProductExample> = {
  traversals: {
    kind: 'graph',
    directed: true,
    weighted: false,
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
    kind: 'graph',
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
    kind: 'graph',
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
    kind: 'graph',
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
    kind: 'graph',
    directed: true,
    weighted: true,
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

  sets: {
    kind: 'sets',
    sets: [
      { label: 'A', at: { x: -110, y: -80 }, radius: 170 },
      { label: 'B', at: { x: 110, y: -80 }, radius: 170 },
      { label: 'C', at: { x: 0, y: 110 }, radius: 130 },
    ],
    queries: [
      {
        selects: 'A ∩ B',
        sections: [
          ['A', 'B'],
          ['A', 'B', 'C'],
        ],
      },
      {
        selects: 'C',
        sections: [['C'], ['A', 'C'], ['B', 'C'], ['A', 'B', 'C']],
      },
      {
        selects: 'A',
        sections: [['A'], ['A', 'C'], ['A', 'B'], ['A', 'B', 'C']],
      },
    ],
  },
};

export type ExampleCard = { id: ExampleProductId; card: ProductCard };

export const exampleCards: ExampleCard[] = products.flatMap(
  ({ id, navigation }) =>
    navigation.card && id in productExamples
      ? [{ id: id as ExampleProductId, card: navigation.card }]
      : [],
);

export const DEFAULT_EXAMPLE = nullThrows(
  exampleCards[0],
  'no product offers both a navigation card and an example',
).id;
