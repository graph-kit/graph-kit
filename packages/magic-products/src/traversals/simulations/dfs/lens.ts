import { Graph } from '@magic/shared/graph';
import { Lens } from '@magic/shared/lens';
import { createEdgeIdThemer, createNodeIdThemer } from '@magic/shared/theme';

import { edgeRoles, nodeRoles } from '../shared.ts';
import Frontier from './components/Frontier.vue';
import Visited from './components/Visited.vue';
import { DfsFrame } from './frame.ts';

export const slotIds = {
  visited: 'dfs/visited',
  frontier: 'dfs/frontier',
} as const;

export const dfsLens = (graph: Graph) => {
  const current = createNodeIdThemer(graph, nodeRoles.current);
  const frontier = createNodeIdThemer(graph, nodeRoles.pending);
  const visited = createNodeIdThemer(graph, nodeRoles.visited);
  const traveled = createEdgeIdThemer(graph, edgeRoles.traveled);

  // order matters: latter elements take priority over earlier ones
  const themers = [frontier, visited, current, traveled];

  const lens: Lens = {
    id: 'dfs',
    components: [
      { component: Visited, position: 'center-left', id: slotIds.visited },
      { component: Frontier, position: 'center-right', id: slotIds.frontier },
    ],
    activate: () => {
      for (const { themer } of themers) themer.activate();
    },
    deactivate: () => {
      for (const { themer } of themers) themer.deactivate();
    },
  };

  const syncToFrame = (frame: DfsFrame) => {
    current.setId(frame.exploredNode);
    frontier.setIds(frame.frontierNodeIds ?? []);
    visited.setIds(frame.visitedNodeIds ?? []);
    traveled.setIds(frame.traveledEdgeIds ?? []);
  };

  return { lens, syncToFrame };
};
