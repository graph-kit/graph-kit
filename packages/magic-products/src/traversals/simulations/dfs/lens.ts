import { Graph } from '@magic/shared/graph';
import { Lens } from '@magic/shared/lens';
import { createEdgeIdThemer, createNodeIdThemer } from '@magic/shared/theme';

import { edgeRoles, nodeRoles } from '../shared.ts';
import Stacked from './components/Stacked.vue';
import Visited from './components/Visited.vue';
import { DfsFrame } from './frame.ts';

export const slotIds = {
  visited: 'dfs/visited',
  stack: 'dfs/stack',
} as const;

export const dfsLens = (graph: Graph) => {
  const current = createNodeIdThemer(graph, nodeRoles.current);
  const stacked = createNodeIdThemer(graph, nodeRoles.pending);
  const visited = createNodeIdThemer(graph, nodeRoles.visited);
  const traveled = createEdgeIdThemer(graph, edgeRoles.traveled);
  const active = createEdgeIdThemer(graph, edgeRoles.active);

  // order matters: latter elements take priority over earlier ones
  const themers = [stacked, visited, current, traveled, active];

  const lens: Lens = {
    id: 'dfs',
    components: [
      { component: Visited, position: 'center-left', id: slotIds.visited },
      { component: Stacked, position: 'center-right', id: slotIds.stack },
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
    stacked.setIds(frame.stackNodeIds ?? []);
    visited.setIds(frame.visitedNodeIds ?? []);
    traveled.setIds(frame.traveledEdgeIds ?? []);
    active.setId(frame.activeEdgeId);
  };

  return { lens, syncToFrame };
};
