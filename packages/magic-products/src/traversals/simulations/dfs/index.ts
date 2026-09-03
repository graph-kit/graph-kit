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
  (visited: Set<string>, frontier: string[]) =>
  <T extends DfsFrame>(fields: T) => ({
    visitedNodeIds: [...visited],
    frontierNodeIds: [...frontier],
    ...fields,
  });

/**
 * the frontier holds the newest find last, and the traversal always takes from
 * that end. that single rule is the whole of depth-first search: picking the
 * most recent discovery keeps walking away from the start, and running out of
 * new neighbors is what backtracking looks like from the inside
 *
 * a node is marked visited when it leaves the frontier rather than when it
 * joins, so the frontier can hold the same node twice and the traversal has to
 * notice on the way out
 */
const collectDfsFrames = (
  graph: Graph,
  startNodeId: string,
  frameCollector: FrameCollector<DfsFrame>,
) => {
  const adjList = graph.adjacencyLists.standard.value;
  if (!(startNodeId in adjList)) return;

  const visited = new Set<string>();
  const frontier = [startNodeId];
  const frame = createFrame(visited, frontier);

  frameCollector.add(
    frame({
      type: 'start',
      node: startNodeId,
    }),
  );

  while (frontier.length > 0) {
    const node = nullThrows(frontier.pop(), 'frontier emptied mid take');

    frameCollector.add(
      frame({
        type: 'explore-node',
        exploredNode: node,
      }),
    );

    if (visited.has(node)) {
      frameCollector.add(
        frame({
          type: 'taken-node-already-visited',
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
      frontier.push(neighbor);

      frameCollector.add(
        frame({
          type: 'discover-node',
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
