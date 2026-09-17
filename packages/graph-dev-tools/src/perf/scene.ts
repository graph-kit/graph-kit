/**
 * Deterministic scene generation for performance runs.
 *
 * Without this, two measurements are never comparable: a graph laid out by hand
 * differs between browsers, between commits and between attempts, and the
 * difference shows up as noise on top of whatever is being measured.
 */

type SceneNode = { id: string; position: { x: number; y: number } };
type SceneEdge = { source: string; target: string };

/**
 * the slice of the graph's action surface a scene needs. duck typed on purpose,
 * and loosely
 */
export type SceneGraph = {
  actions: {
    addElements: (elements: { nodes: any[]; edges: any[] }) => unknown;
  };
};

export type SceneOptions = {
  nodes: number;
};

/** near what a hand drawn graph tends to be */
const EDGES_PER_NODE = 1.5;

/** world space the nodes are scattered across */
const SCENE_WIDTH = 1200;
const SCENE_HEIGHT = 700;

const SEED = 1;

/*
  mulberry32. a real PRNG rather than Math.random because a scene that differs
  run to run defeats the purpose, and rather than a fixed layout because a grid
  makes every edge the same length and hides whatever depends on edge geometry
*/
const createRandom = (seed: number) => {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const buildScene = (
  graph: SceneGraph,
  { nodes: nodeCount }: SceneOptions,
) => {
  const edgeCount = Math.round(nodeCount * EDGES_PER_NODE);
  const random = createRandom(SEED);

  const nodes: SceneNode[] = Array.from({ length: nodeCount }, (_, index) => ({
    id: `perf-node-${index}`,
    position: {
      x: Math.round(random() * SCENE_WIDTH),
      y: Math.round(random() * SCENE_HEIGHT),
    },
  }));

  const edges: SceneEdge[] = [];

  /*
    every node past the first gets one edge to an earlier node, so the graph is
    connected and no node renders as an isolated dot. the remainder is scattered
    at random, which is what produces the crossings and shared endpoints that
    the edge geometry code actually pays for
  */
  for (let index = 1; index < nodeCount && edges.length < edgeCount; index++) {
    edges.push({
      source: nodes[Math.floor(random() * index)].id,
      target: nodes[index].id,
    });
  }

  while (edges.length < edgeCount && nodeCount > 1) {
    const source = nodes[Math.floor(random() * nodeCount)];
    const target = nodes[Math.floor(random() * nodeCount)];
    if (source.id === target.id) continue;
    edges.push({ source: source.id, target: target.id });
  }

  graph.actions.addElements({ nodes, edges });

  return { nodes, edges };
};
