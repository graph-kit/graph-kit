import { Graph } from '@magic/shared/graph';
import { Lens } from '@magic/shared/lens';
import { createEdgeIdThemer, createNodeIdThemer } from '@magic/shared/theme';

import { edgeRoles, nodeRoles } from '../shared.ts';
import Queued from './components/Queued.vue';
import Visited from './components/Visited.vue';
import { BfsFrame } from './frame.ts';

export const slotIds = {
  visited: 'bfs/visited',
  queue: 'bfs/queued',
} as const;

export const bfsLens = (graph: Graph) => {
  const current = createNodeIdThemer(graph, nodeRoles.current);
  const queued = createNodeIdThemer(graph, nodeRoles.pending);
  const visited = createNodeIdThemer(graph, nodeRoles.visited);
  const traveled = createEdgeIdThemer(graph, edgeRoles.traveled);
  const active = createEdgeIdThemer(graph, edgeRoles.active);

  // order matters: latter elements take priority over earlier ones
  const themers = [queued, visited, current, traveled, active];

  const lens: Lens = {
    id: 'bfs',
    components: [
      { component: Visited, position: 'center-left', id: slotIds.visited },
      { component: Queued, position: 'center-right', id: slotIds.queue },
    ],
    activate: () => {
      for (const { themer } of themers) themer.activate();
    },
    deactivate: () => {
      for (const { themer } of themers) themer.deactivate();
    },
  };

  const syncToFrame = (frame: BfsFrame) => {
    current.setId(frame.exploredNode);
    queued.setIds(frame.queuedNodeIds ?? []);
    visited.setIds(frame.visitedNodeIds ?? []);
    traveled.setIds(frame.traveledEdgeIds ?? []);
    active.setId(frame.activeEdgeId);
  };

  return { lens, syncToFrame };
};
