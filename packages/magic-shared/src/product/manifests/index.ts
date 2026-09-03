import { productThumbnail } from './thumbnail.ts';
import { ProductManifest } from './types.ts';

export const manifests = {
  sets: {
    id: 'sets',
    multiplayer: false,
    name: 'Magic Sets',
    abbreviatedName: 'SET',
    navigation: {
      slug: 'sets',
      card: {
        name: 'Set Theory',
        description:
          'Create sets and write queries that light up the regions they select.',
      },
    },
    meta: {
      title: 'Set Theory | Magic Graphs',
      description:
        'Draw sets on an infinite canvas and write queries like A union B that highlight the regions they select as you type.',
      ogImage: productThumbnail('sets', 'dark'),
    },
  },
  'markov-chains': {
    id: 'markov-chains',
    multiplayer: true,
    name: 'Magic Markov Chains',
    abbreviatedName: 'MKV',
    navigation: {
      slug: 'markov-chains',
      card: {
        name: 'Markov Chains',
        description:
          'Wire up states, set transition probabilities and read off the classes, periodicity and stationary distribution.',
      },
    },
    meta: {
      title: 'Markov Chains | Magic Graphs',
      description:
        'Build a Markov chain state by state, set the transition probabilities between them and surface its communicating classes, recurrent and absorbing states, periodicity and stationary distribution.',
      ogImage: productThumbnail('markov-chains', 'dark'),
    },
  },
  'avl-trees': {
    id: 'avl-trees',
    multiplayer: false,
    name: 'Magic AVL Trees',
    abbreviatedName: 'AVL',
    navigation: {
      slug: 'trees',
      card: {
        name: 'AVL Trees',
        description:
          'Insert and remove values, then step through each rotation the tree makes to rebalance.',
      },
    },
    meta: {
      title: 'AVL Trees | Magic Graphs',
      description:
        'Insert and remove values in an AVL tree and step through every rotation the tree performs to keep itself balanced.',
      ogImage: productThumbnail('avl-trees', 'dark'),
    },
  },
  traversals: {
    id: 'traversals',
    multiplayer: true,
    name: 'Magic Traversals',
    abbreviatedName: 'TRV',
    navigation: {
      slug: 'traversals',
      card: {
        name: 'Traversals',
        description:
          'Step through BFS and DFS one visit at a time, tracking the queue, the stack and the visited set.',
      },
    },
    meta: {
      title: 'Traversals | Magic Graphs',
      description:
        'Run breadth first and depth first search on your own graph and track the queue, the stack and the visited set at every step.',
      ogImage: productThumbnail('traversals', 'dark'),
    },
  },
  'path-finding': {
    id: 'path-finding',
    multiplayer: true,
    name: 'Magic Path Finding',
    abbreviatedName: 'PTH',
    navigation: {
      slug: 'path',
      card: {
        name: 'Path Finding',
        description:
          'Run Dijkstra, Bellman-Ford and Floyd Warshall to surface every shortest path.',
      },
    },
    meta: {
      title: 'Path Finding | Magic Graphs',
      description:
        "Run Dijkstra's, Bellman-Ford and Floyd Warshall on a weighted graph you build and trace the shortest paths as they take shape, step by step.",
      ogImage: productThumbnail('path-finding', 'dark'),
    },
  },
  'min-spanning-trees': {
    id: 'min-spanning-trees',
    multiplayer: true,
    name: 'Magic Minimum Spanning Trees',
    abbreviatedName: 'MST',
    navigation: {
      slug: 'mst',
      card: {
        name: 'Minimum Spanning Trees',
        description:
          "Run Kruskal's and Prim's to pick the cheapest edges that connect everything.",
      },
    },
    meta: {
      title: 'Minimum Spanning Trees | Magic Graphs',
      description:
        "Run Kruskal's and Prim's on a weighted graph you build and trace each one as it grows a minimum spanning tree edge by edge.",
      ogImage: productThumbnail('min-spanning-trees', 'dark'),
    },
  },
  dev: {
    id: 'dev',
    multiplayer: false,
    name: 'Dev Playground',
    abbreviatedName: 'DEV',
    navigation: {
      slug: 'dev',
    },
    meta: {
      title: 'Dev Playground | Magic Graphs',
      description:
        'Internal playground for exercising graph features outside of a product experience.',
      ogImage: productThumbnail('dev', 'dark'),
    },
  },
  welcome: {
    id: 'welcome',
    multiplayer: false,
    name: 'Go To Experiences',
    abbreviatedName: 'HOME',
    navigation: {
      slug: 'welcome',
    },
    meta: {
      title: 'Magic Graphs',
      description:
        'Interactive computer science theory: traversals, shortest paths, spanning trees, AVL trees, Markov chains and set theory.',
    },
  },
} as const satisfies Record<string, ProductManifest>;

export type ProductId = keyof typeof manifests;

/** the same manifests as a list, for rendering every product in order */
export const products: ProductManifest[] = Object.values(manifests);
