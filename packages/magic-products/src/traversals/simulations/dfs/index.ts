import { nullThrows } from '@core/utils/assert';
import { Graph } from '@magic/shared/graph';
import {
  FrameCollector,
  SimulationDefinition,
} from '@magic/shared/simulation/types';

import {
  TraversalSimulationOptions,
  edgeBetween,
  startNodeGuard,
} from '../shared.ts';
import { dfsExplainer } from './explainer.ts';
import { DfsFrame } from './frame.ts';
import { dfsLens } from './lens.ts';

const createFrame =
  (visited: Set<string>, stack: string[]) =>
  <T extends DfsFrame>(fields: T) => ({
    visitedNodeIds: [...visited],
    stackNodeIds: [...stack],
    ...fields,
  });

/**
 * the queue in breadth-first search becomes a stack here, and that swap is the
 * entire difference: popping the newest node keeps walking away from the start
 * rather than fanning out around it, and running out of unvisited neighbors is
 * what backtracking looks like from the inside
 *
 * a node is marked visited when it is popped rather than when it is pushed, so
 * the stack can hold the same node twice and the traversal has to notice on the
 * way out. that redundant wait is worth watching, so the frames narrate it
 * instead of optimizing it away
 */
const collectDfsFrames = (
  graph: Graph,
  startNodeId: string,
  frameCollector: FrameCollector<DfsFrame>,
) => {
  const adjList = graph.adjacencyLists.standard.value;
  if (!(startNodeId in adjList)) return;

  const visited = new Set<string>();
  const stack = [startNodeId];
  const frame = createFrame(visited, stack);

  frameCollector.add(
    frame({
      type: 'start',
      node: startNodeId,
    }),
  );

  while (stack.length > 0) {
    const node = nullThrows(stack.pop(), 'stack emptied mid pop');

    frameCollector.add(
      frame({
        type: 'explore-node',
        exploredNode: node,
      }),
    );

    if (visited.has(node)) {
      frameCollector.add(
        frame({
          type: 'popped-node-already-visited',
          node,
        }),
      );
      continue;
    }

    visited.add(node);

    frameCollector.add(
      frame({
        type: 'mark-visited',
        node,
      }),
    );

    const neighbors = adjList[node] ?? [];

    if (neighbors.length > 0) {
      frameCollector.add(
        frame({
          type: 'travel-edge',
          traveledEdgeIds: neighbors.map((neighbor) =>
            edgeBetween(graph, node, neighbor),
          ),
        }),
      );
    }

    // to keep same visit order the recursive version would have
    for (const neighbor of [...neighbors].reverse()) {
      if (visited.has(neighbor)) {
        frameCollector.add(
          frame({
            type: 'previously-visited',
            node: neighbor,
          }),
        );
        continue;
      }
      stack.push(neighbor);

      frameCollector.add(
        frame({
          type: 'push-node',
          node: neighbor,
        }),
      );
    }
  }

  frameCollector.add(frame({ type: 'end' }));
};

export const dfsSimulation = (
  options: TraversalSimulationOptions,
): SimulationDefinition<DfsFrame> => ({
  id: 'dfs',
  guard: startNodeGuard(options),
  collectFrames: (collector) => {
    collectDfsFrames(
      options.graph,
      nullThrows(options.startNodeId.value, 'start node id not defined'),
      collector,
    );
  },
  setup: (context) => {
    const { lens, syncToFrame } = dfsLens(options.graph);
    return {
      lens,
      explainer: dfsExplainer(options.graph),
      onSetupCompleted: syncToFrame,
      onFrameTransition: syncToFrame,
      onViolation: context.stopSimulation,
    };
  },
});
