import { productThumbnail } from './thumbnail.ts';
import { MagicProductManifest } from './types.ts';

/**
 * every product experience, in the order the navigation menu lists them. shared
 * features like navigation need each product's id, slug and card, so manifests
 * are declared together here rather than fragmented beside every product's view
 */
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
          'Draw sets on a canvas and watch queries light up the regions they select.',
      },
    },
    meta: {
      title: 'Set Theory | Magic Graphs',
      description:
        'Draw sets on an infinite canvas, write queries like A union B, and watch the regions they select highlight as you type.',
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
          'Wire up states, set transition probabilities and follow the walk.',
      },
    },
    meta: {
      title: 'Markov Chains | Magic Graphs',
      description:
        'Build a Markov chain state by state, set the transition probabilities between them and step through the walk to see where it settles.',
      ogImage: productThumbnail('markov-chains', 'dark'),
    },
  },
  'avl-trees': {
    id: 'avl-trees',
    // false until we implement pausing inbound socket packets. basically we must pause listening and
    // sending events on the client when the simulation is activated and resume with a force push of the post-sim state
    multiplayer: false,
    name: 'Magic AVL Trees',
    abbreviatedName: 'AVL',
    navigation: {
      slug: 'trees',
      card: {
        name: 'AVL Trees',
        description:
          'Insert and remove values, then watch the tree rotate back into balance.',
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
          'Step through BFS and DFS one visit at a time on a graph you build.',
      },
    },
    meta: {
      title: 'Traversals | Magic Graphs',
      description:
        'Run breadth first and depth first search on your own graph and watch the queue, the stack and the visited set change at every step.',
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
          'Watch Dijkstra, Bellman Ford and Floyd Warshall hunt for shortest paths.',
      },
    },
    meta: {
      title: 'Path Finding | Magic Graphs',
      description:
        "Run Dijkstra's, Bellman Ford and Floyd Warshall on a weighted graph you build and watch the shortest paths take shape step by step.",
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
          "Watch Kruskal's and Prim's pick the cheapest edges that connect everything.",
      },
    },
    meta: {
      title: 'Minimum Spanning Trees | Magic Graphs',
      description:
        "Run Kruskal's and Prim's on a weighted graph you build and see each one grow a minimum spanning tree edge by edge.",
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
} as const satisfies Record<string, MagicProductManifest>;

export type ProductId = keyof typeof manifests;

/** the same manifests as a list, for rendering every product in order */
export const products: MagicProductManifest[] = Object.values(manifests);
