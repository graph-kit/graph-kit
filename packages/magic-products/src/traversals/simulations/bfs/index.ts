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
import { bfsExplainer } from './explainer.ts';
import { BfsFrame } from './frame.ts';
import { bfsLens } from './lens.ts';

const createFrame =
  (visited: Set<string>, queue: string[]) =>
  <T extends BfsFrame>(fields: T) => ({
    visitedNodeIds: [...visited],
    queuedNodeIds: [...queue],
    ...fields,
  });

/**
 * a node is marked visited when it leaves the queue rather than when it joins,
 * so the queue can hold the same node twice and the traversal has to notice on
 * the way out. that redundant wait is the part of breadth-first search worth
 * watching, so the frames narrate it instead of optimizing it away
 */
const collectBfsFrames = (
  graph: Graph,
  startNodeId: string,
  frameCollector: FrameCollector<BfsFrame>,
) => {
  const adjList = graph.adjacencyLists.standard.value;
  if (!(startNodeId in adjList)) return;

  const visited = new Set<string>();
  const queue = [startNodeId];
  const frame = createFrame(visited, queue);

  frameCollector.add(
    frame({
      type: 'start',
      node: startNodeId,
    }),
  );

  while (queue.length > 0) {
    const node = nullThrows(queue.shift(), 'queue emptied mid dequeue');

    frameCollector.add(
      frame({
        type: 'explore-node',
        exploredNode: node,
      }),
    );

    if (visited.has(node)) {
      frameCollector.add(
        frame({
          type: 'dequeued-node-already-visited',
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

    for (const neighbor of neighbors) {
      if (visited.has(neighbor)) {
        frameCollector.add(
          frame({
            type: 'previously-visited',
            node: neighbor,
          }),
        );
        continue;
      }
      queue.push(neighbor);

      frameCollector.add(
        frame({
          type: 'enqueue-node',
          node: neighbor,
        }),
      );
    }
  }

  frameCollector.add(frame({ type: 'end' }));
};

export const bfsSimulation = (
  options: TraversalSimulationOptions,
): SimulationDefinition<BfsFrame> => ({
  id: 'bfs',
  guard: startNodeGuard(options),
  collectFrames: (collector) => {
    collectBfsFrames(
      options.graph,
      nullThrows(options.startNodeId.value, 'start node id not defined'),
      collector,
    );
  },
  setup: (context) => {
    const { lens, syncToFrame } = bfsLens(options.graph);
    return {
      lens,
      explainer: bfsExplainer(options.graph),
      onSetupCompleted: syncToFrame,
      onFrameTransition: syncToFrame,
      onViolation: context.stopSimulation,
    };
  },
});
