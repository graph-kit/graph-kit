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
  nodeCount: number;
};

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

export const buildScene = (graph: SceneGraph, { nodeCount }: SceneOptions) => {
  const random = createRandom(SEED);

  const nodes: SceneNode[] = Array.from({ length: nodeCount }, (_, index) => ({
    id: `perf-node-${index}`,
    position: {
      x: Math.round(random() * SCENE_WIDTH),
      y: Math.round(random() * SCENE_HEIGHT),
    },
  }));

  const edges: SceneEdge[] = [];

  for (let i = 0; i + 1 < nodeCount; i++) {
    edges.push({ source: nodes[i].id, target: nodes[i + 1].id });
  }

  graph.actions.addElements({ nodes, edges });

  return { nodes, edges };
};
