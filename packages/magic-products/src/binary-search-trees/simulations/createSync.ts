import { Graph } from '@magic/shared/graph';

import { ROOT_POSITION, treeToGraph } from '../graph-conversion/treeToGraph.ts';
import { AVLFrame } from './frames.ts';

export const createSync = (graph: Graph) => (frame: AVLFrame) => {
  graph.animation.capture(() => {
    graph.actions.removeElements({
      nodes: graph.nodes.value,
      edges: [],
    });

    graph.actions.addElements(treeToGraph(frame.root, ROOT_POSITION));
  });
};
