import { Graph } from '@magic/shared/graph';

import { compareCompanion } from '../graph-conversion/compareCompanion.ts';
import { treeToGraph } from '../graph-conversion/treeToGraph.ts';
import { AVLFrame } from './frames.ts';

const ROOT_POSITION = {
  x: 800,
  y: 400,
};

export const createSync = (graph: Graph) => (frame: AVLFrame) => {
  graph.animation.capture(() => {
    graph.actions.removeElements({
      nodes: graph.nodes.value,
      edges: [],
    });

    const graphState = treeToGraph(frame.root, ROOT_POSITION);
    if (frame.action === 'compare') compareCompanion(frame, graphState);

    graph.actions.addElements(graphState);
  });
};
