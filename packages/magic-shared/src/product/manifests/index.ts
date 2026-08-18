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
        description: 'the desmos of set theory!',
        thumbnail: {
          light: '/products/thumbnails/set-visualizer.png',
          dark: '/products/thumbnails/set-visualizer.png',
        },
      },
    },
    meta: {
      title: 'Sets',
      description: 'The Desmos of Set Theory!',
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
        description: 'Learn the ins and outs of Markov Chains!',
        thumbnail: {
          light: '/products/thumbnails/markov-chains.png',
          dark: '/products/thumbnails/markov-chains.png',
        },
      },
    },
    meta: {
      title: 'Markov Chains',
      description: 'this is markov chains in magic graphs',
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
        description: 'Learn about how an AVL tree works!',
        thumbnail: {
          light: '/products/thumbnails/binary-tree.png',
          dark: '/products/thumbnails/binary-tree.png',
        },
      },
    },
    meta: {
      title: 'AVL Trees',
      description: 'this is the basic AVL trees product',
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
        description: 'Learn about how traversals like BFS and DFS work!',
        thumbnail: {
          light: '/products/sim-thumbnails/bfs.png',
          dark: '/products/sim-thumbnails/bfs.png',
        },
      },
    },
    meta: {
      title: 'Traversals!!',
      description: 'this is the traversals product',
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
          'Learn about how path finding algorithms like Dijkstras work!',
        thumbnail: {
          light: '/products/thumbnails/dijkstras.png',
          dark: '/products/thumbnails/dijkstras.png',
        },
      },
    },
    meta: {
      title: 'Path Finding',
      description: 'Path finding description',
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
        description: 'Learn about how MST algorithms like Kruskals work!',
        thumbnail: {
          light: '/products/thumbnails/mst.png',
          dark: '/products/thumbnails/mst.png',
        },
      },
    },
    meta: {
      title: 'Minimum Spanning Trees',
      description: 'this is the minimum spanning trees product',
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
      title: 'Path Finding',
      description: 'Path finding description',
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
        'Use Magic Graphs to learn computer science theory interactively!',
    },
  },
} as const satisfies Record<string, MagicProductManifest>;

export type ProductId = keyof typeof manifests;

/** the same manifests as a list, for rendering every product in order */
export const products: MagicProductManifest[] = Object.values(manifests);
