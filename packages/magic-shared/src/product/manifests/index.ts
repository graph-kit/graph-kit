import { productThumbnail } from './thumbnail.ts';
import { ProductManifest } from './types.ts';

export const manifests = {
  'binary-search-trees': {
    id: 'binary-search-trees',
    multiplayer: false,
    name: 'Binary Search Trees',
    abbreviatedName: 'BST',
    navigation: {
      slug: 'binary-search-trees',
      card: {
        name: 'Binary Search Trees',
        description: 'Insert and remove values and run rebalancing strategies.',
        category: 'data-structures',
      },
    },
    meta: {
      title: 'Binary Search Trees | Magic Graphs',
      description:
        'Insert and remove values in a binary search tree and run rebalancing strategies over it.',
      ogImage: productThumbnail('binary-search-trees', 'dark'),
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
      robots: 'noindex, nofollow',
    },
  },
  'markov-chains': {
    id: 'markov-chains',
    multiplayer: true,
    name: 'Markov Chains',
    abbreviatedName: 'MKV',
    navigation: {
      slug: 'markov-chains',
      card: {
        name: 'Markov Chains',
        description:
          'Wire up states, set transition probabilities and read off the classes, periodicity and stationary distribution.',
        category: 'discrete-math',
      },
    },
    meta: {
      title: 'Markov Chains | Magic Graphs',
      description:
        'Build a Markov chain state by state, set the transition probabilities between them and surface its communicating classes, recurrent and absorbing states, periodicity and stationary distribution.',
      ogImage: productThumbnail('markov-chains', 'dark'),
    },
  },
  'minimum-spanning-trees': {
    id: 'minimum-spanning-trees',
    multiplayer: true,
    name: 'Minimum Spanning Trees',
    abbreviatedName: 'MST',
    navigation: {
      slug: 'minimum-spanning-trees',
      card: {
        name: 'Minimum Spanning Trees',
        description:
          "Run Kruskal's and Prim's to pick the cheapest edges that connect the graph.",
        category: 'graph-algorithms',
      },
    },
    meta: {
      title: 'Minimum Spanning Trees | Magic Graphs',
      description:
        "Run Kruskal's and Prim's on a weighted graph you build and trace each one as it grows a minimum spanning tree edge by edge.",
      ogImage: productThumbnail('minimum-spanning-trees', 'dark'),
    },
  },
  'path-finding': {
    id: 'path-finding',
    multiplayer: true,
    name: 'Path Finding',
    abbreviatedName: 'PTH',
    navigation: {
      slug: 'path-finding',
      card: {
        name: 'Path Finding',
        description:
          "Run Dijkstra's, Bellman-Ford and Floyd-Warshall to surface every shortest path.",
        category: 'graph-algorithms',
      },
    },
    meta: {
      title: 'Path Finding | Magic Graphs',
      description:
        "Run Dijkstra's, Bellman-Ford and Floyd-Warshall on a weighted graph you build and trace the shortest paths as they take shape, step by step.",
      ogImage: productThumbnail('path-finding', 'dark'),
    },
  },
  'set-theory': {
    id: 'set-theory',
    multiplayer: true,
    name: 'Set Theory',
    abbreviatedName: 'SET',
    navigation: {
      slug: 'set-theory',
      card: {
        name: 'Set Theory',
        description:
          'Create sets and write queries that light up the regions they select.',
        category: 'discrete-math',
      },
    },
    meta: {
      title: 'Set Theory | Magic Graphs',
      description:
        'Draw sets on an infinite canvas and write queries like A union B that highlight the regions they select as you type.',
      ogImage: productThumbnail('set-theory', 'dark'),
    },
  },
  traversals: {
    id: 'traversals',
    multiplayer: true,
    name: 'Traversals',
    abbreviatedName: 'TRV',
    navigation: {
      slug: 'traversals',
      card: {
        name: 'Traversals',
        description:
          'Run Breadth-First and Depth-First Search, tracking the queue, the stack and the visited set.',
        category: 'graph-algorithms',
      },
    },
    meta: {
      title: 'Traversals | Magic Graphs',
      description:
        'Run breadth first and depth first search on your own graph and track the queue, the stack and the visited set at every step.',
      ogImage: productThumbnail('traversals', 'dark'),
    },
  },
  welcome: {
    id: 'welcome',
    multiplayer: false,
    name: 'Magic Graphs',
    abbreviatedName: 'HOME',
    navigation: {
      slug: '',
    },
    meta: {
      title: 'Magic Graphs',
      description:
        'Interactive computer science theory: traversals, shortest paths, spanning trees, binary search trees, Markov chains and set theory.',
    },
  },
} as const satisfies Record<string, ProductManifest>;

export type ProductId = keyof typeof manifests;

/** the same manifests as a list, for rendering every product in order */
export const products: ProductManifest[] = Object.values(manifests);
