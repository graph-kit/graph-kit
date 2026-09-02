import { Coordinate } from '@core/utils/canvas/index';
import { ProductId } from '@magic/shared/product';

/** every product the scene places, so no edge can name a node that is absent */
export type WelcomeProductId = Exclude<ProductId, 'dev' | 'welcome'>;

export type WelcomeArrangement = {
  /** names the layout for whoever is editing these, never shown to a visitor */
  name: string;
  /**
   * placement relative to the other nodes, in world units. the origin these are
   * written against is arbitrary, only the distances between them matter, and no
   * offset may Y = |220|
   */
  nodes: Record<WelcomeProductId, Coordinate>;
  /** [source, target] pairs, drawn once every node has animated in */
  edges: [WelcomeProductId, WelcomeProductId][];
};

export const welcomeArrangements: WelcomeArrangement[] = [
  {
    name: 'zigzag',
    nodes: {
      sets: { x: -560, y: 120 },
      'min-spanning-trees': { x: -336, y: -120 },
      'path-finding': { x: -112, y: 120 },
      'avl-trees': { x: 112, y: -120 },
      traversals: { x: 336, y: 120 },
      'markov-chains': { x: 560, y: -120 },
    },
    edges: [
      ['sets', 'min-spanning-trees'],
      ['min-spanning-trees', 'path-finding'],
      ['path-finding', 'avl-trees'],
      ['avl-trees', 'path-finding'],
      ['avl-trees', 'traversals'],
      ['traversals', 'markov-chains'],
      ['markov-chains', 'traversals'],
      ['min-spanning-trees', 'avl-trees'],
      ['path-finding', 'traversals'],
    ],
  },
  {
    name: 'orbit',
    nodes: {
      sets: { x: -490, y: 0 },
      'min-spanning-trees': { x: -220, y: -220 },
      'path-finding': { x: -220, y: 220 },
      'avl-trees': { x: 0, y: 0 },
      'markov-chains': { x: 490, y: -170 },
      traversals: { x: 490, y: 170 },
    },
    edges: [
      ['avl-trees', 'sets'],
      ['avl-trees', 'min-spanning-trees'],
      ['avl-trees', 'path-finding'],
      ['avl-trees', 'markov-chains'],
      ['avl-trees', 'traversals'],
      ['min-spanning-trees', 'sets'],
      ['sets', 'path-finding'],
      ['markov-chains', 'traversals'],
      ['traversals', 'markov-chains'],
    ],
  },
  {
    name: 'arc',
    nodes: {
      sets: { x: -560, y: 211 },
      'min-spanning-trees': { x: -336, y: -71 },
      'path-finding': { x: -112, y: -211 },
      'avl-trees': { x: 112, y: -211 },
      traversals: { x: 336, y: -71 },
      'markov-chains': { x: 560, y: 211 },
    },
    edges: [
      ['sets', 'min-spanning-trees'],
      ['min-spanning-trees', 'path-finding'],
      ['path-finding', 'avl-trees'],
      ['avl-trees', 'path-finding'],
      ['avl-trees', 'traversals'],
      ['traversals', 'markov-chains'],
      ['markov-chains', 'traversals'],
      ['min-spanning-trees', 'traversals'],
      ['sets', 'markov-chains'],
    ],
  },
  {
    name: 'lattice',
    nodes: {
      sets: { x: -400, y: -180 },
      'min-spanning-trees': { x: -400, y: 180 },
      'path-finding': { x: 0, y: -180 },
      'avl-trees': { x: 0, y: 180 },
      traversals: { x: 400, y: -180 },
      'markov-chains': { x: 400, y: 180 },
    },
    edges: [
      ['sets', 'path-finding'],
      ['path-finding', 'traversals'],
      ['traversals', 'path-finding'],
      ['min-spanning-trees', 'avl-trees'],
      ['avl-trees', 'markov-chains'],
      ['sets', 'min-spanning-trees'],
      ['path-finding', 'avl-trees'],
      ['avl-trees', 'path-finding'],
      ['traversals', 'markov-chains'],
    ],
  },
  {
    name: 'spine',
    nodes: {
      sets: { x: -540, y: 0 },
      'path-finding': { x: -360, y: -200 },
      'min-spanning-trees': { x: -180, y: 0 },
      'avl-trees': { x: 180, y: 0 },
      traversals: { x: 360, y: 200 },
      'markov-chains': { x: 540, y: 0 },
    },
    edges: [
      ['sets', 'min-spanning-trees'],
      ['min-spanning-trees', 'avl-trees'],
      ['avl-trees', 'min-spanning-trees'],
      ['avl-trees', 'markov-chains'],
      ['markov-chains', 'avl-trees'],
      ['sets', 'path-finding'],
      ['path-finding', 'min-spanning-trees'],
      ['avl-trees', 'traversals'],
      ['traversals', 'markov-chains'],
    ],
  },
  {
    name: 'diamond',
    nodes: {
      sets: { x: -600, y: 0 },
      'path-finding': { x: -280, y: 0 },
      'min-spanning-trees': { x: 0, y: -200 },
      'avl-trees': { x: 0, y: 200 },
      traversals: { x: 280, y: 0 },
      'markov-chains': { x: 600, y: 0 },
    },
    edges: [
      ['path-finding', 'min-spanning-trees'],
      ['min-spanning-trees', 'traversals'],
      ['traversals', 'avl-trees'],
      ['avl-trees', 'path-finding'],
      ['min-spanning-trees', 'avl-trees'],
      ['sets', 'path-finding'],
      ['path-finding', 'sets'],
      ['traversals', 'markov-chains'],
      ['markov-chains', 'traversals'],
    ],
  },
  {
    name: 'wave',
    nodes: {
      sets: { x: -550, y: 0 },
      'min-spanning-trees': { x: -330, y: 190 },
      'path-finding': { x: -110, y: 118 },
      'avl-trees': { x: 110, y: -118 },
      traversals: { x: 330, y: -190 },
      'markov-chains': { x: 550, y: 0 },
    },
    edges: [
      ['sets', 'min-spanning-trees'],
      ['min-spanning-trees', 'path-finding'],
      ['path-finding', 'avl-trees'],
      ['avl-trees', 'path-finding'],
      ['avl-trees', 'traversals'],
      ['traversals', 'markov-chains'],
      ['markov-chains', 'traversals'],
      ['sets', 'path-finding'],
      ['avl-trees', 'markov-chains'],
    ],
  },
  {
    name: 'chevron',
    nodes: {
      sets: { x: -420, y: 0 },
      'min-spanning-trees': { x: -20, y: -160 },
      'path-finding': { x: -20, y: 160 },
      'avl-trees': { x: 240, y: 0 },
      traversals: { x: 420, y: -220 },
      'markov-chains': { x: 420, y: 220 },
    },
    edges: [
      ['sets', 'min-spanning-trees'],
      ['sets', 'path-finding'],
      ['min-spanning-trees', 'avl-trees'],
      ['path-finding', 'avl-trees'],
      ['avl-trees', 'path-finding'],
      ['avl-trees', 'traversals'],
      ['avl-trees', 'markov-chains'],
      ['min-spanning-trees', 'traversals'],
      ['path-finding', 'markov-chains'],
    ],
  },
  {
    name: 'funnel',
    nodes: {
      sets: { x: -480, y: -220 },
      'min-spanning-trees': { x: -480, y: 220 },
      'path-finding': { x: -20, y: -120 },
      'avl-trees': { x: -20, y: 120 },
      traversals: { x: 480, y: -80 },
      'markov-chains': { x: 480, y: 80 },
    },
    edges: [
      ['sets', 'min-spanning-trees'],
      ['sets', 'path-finding'],
      ['min-spanning-trees', 'avl-trees'],
      ['path-finding', 'avl-trees'],
      ['avl-trees', 'path-finding'],
      ['path-finding', 'traversals'],
      ['avl-trees', 'markov-chains'],
      ['traversals', 'markov-chains'],
      ['markov-chains', 'traversals'],
    ],
  },
  {
    name: 'cascade',
    nodes: {
      sets: { x: -550, y: -200 },
      'min-spanning-trees': { x: -330, y: -200 },
      'path-finding': { x: -110, y: 0 },
      'avl-trees': { x: 110, y: 0 },
      traversals: { x: 330, y: 200 },
      'markov-chains': { x: 550, y: 200 },
    },
    edges: [
      ['sets', 'min-spanning-trees'],
      ['min-spanning-trees', 'path-finding'],
      ['path-finding', 'avl-trees'],
      ['avl-trees', 'path-finding'],
      ['avl-trees', 'traversals'],
      ['traversals', 'markov-chains'],
      ['markov-chains', 'traversals'],
      ['min-spanning-trees', 'avl-trees'],
      ['path-finding', 'traversals'],
    ],
  },
  {
    name: 'bowtie',
    nodes: {
      sets: { x: -560, y: -190 },
      'min-spanning-trees': { x: -560, y: 190 },
      'path-finding': { x: -120, y: 0 },
      'avl-trees': { x: 120, y: 0 },
      traversals: { x: 560, y: -190 },
      'markov-chains': { x: 560, y: 190 },
    },
    edges: [
      ['sets', 'min-spanning-trees'],
      ['sets', 'path-finding'],
      ['min-spanning-trees', 'path-finding'],
      ['path-finding', 'avl-trees'],
      ['avl-trees', 'path-finding'],
      ['avl-trees', 'traversals'],
      ['avl-trees', 'markov-chains'],
      ['traversals', 'markov-chains'],
      ['markov-chains', 'traversals'],
    ],
  },
  {
    name: 'triangle',
    nodes: {
      sets: { x: -560, y: 190 },
      'min-spanning-trees': { x: -280, y: 0 },
      'path-finding': { x: 0, y: -190 },
      'avl-trees': { x: 0, y: 190 },
      traversals: { x: 280, y: 0 },
      'markov-chains': { x: 560, y: 190 },
    },
    edges: [
      ['sets', 'min-spanning-trees'],
      ['min-spanning-trees', 'path-finding'],
      ['path-finding', 'traversals'],
      ['traversals', 'markov-chains'],
      ['markov-chains', 'avl-trees'],
      ['avl-trees', 'markov-chains'],
      ['avl-trees', 'sets'],
      ['min-spanning-trees', 'traversals'],
      ['traversals', 'min-spanning-trees'],
    ],
  },
];
