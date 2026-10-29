import { Graph } from '@magic/shared/graph';
import { Lens } from '@magic/shared/lens';
import {
  EdgeRole,
  NodeRole,
  createEdgeIdThemer,
  createNodeIdThemer,
} from '@magic/shared/theme';

import { ComputedRef } from 'vue';

import { createInDegreeLabelThemer } from '../../createInDegreeLabelThemer.ts';
import Ordered from './components/Ordered.vue';
import Queued from './components/Queued.vue';
import { createFadedEdgeThemer } from './createFadedEdgeThemer.ts';
import { KahnsFrame } from './frame.ts';
import { slotIds } from './slotIds.ts';

const nodeRoles = {
  decrementing: 'candidate',
  ordered: 'settled',
  placed: 'active',
  queued: 'pending',
  stuck: 'violation',
} as const satisfies Record<string, NodeRole>;

const edgeRoles = {
  removing: 'active',
} as const satisfies Record<string, EdgeRole>;

export const kahnsLens = (
  graph: Graph,
  currentFrame: ComputedRef<KahnsFrame>,
) => {
  const queued = createNodeIdThemer(graph, nodeRoles.queued);
  const ordered = createNodeIdThemer(graph, nodeRoles.ordered);
  const decrementing = createNodeIdThemer(graph, nodeRoles.decrementing);
  const stuck = createNodeIdThemer(graph, nodeRoles.stuck);
  const placed = createNodeIdThemer(graph, nodeRoles.placed);
  const removed = createFadedEdgeThemer(graph);
  const removing = createEdgeIdThemer(graph, edgeRoles.removing);
  const inDegrees = {
    themer: createInDegreeLabelThemer(graph, (id) =>
      currentFrame.value.orderedNodeIds.includes(id)
        ? undefined
        : currentFrame.value.inDegrees[id],
    ),
  };

  const themers = [
    queued,
    ordered,
    decrementing,
    stuck,
    placed,
    removed,
    removing,
    inDegrees,
  ];

  const lens: Lens = {
    id: 'topological-sort/kahns',
    components: [
      { component: Ordered, position: 'center-left', id: slotIds.order },
      { component: Queued, position: 'center-right', id: slotIds.queue },
    ],
    activate: () => {
      for (const { themer } of themers) themer.activate();
    },
    deactivate: () => {
      for (const { themer } of themers) themer.deactivate();
    },
  };

  const syncToFrame = (frame: KahnsFrame) => {
    const isRemoval =
      frame.type === 'remove-edge' || frame.type === 'enqueue-node';

    queued.setIds(frame.queuedNodeIds);
    ordered.setIds(frame.orderedNodeIds);
    decrementing.setId(frame.type === 'remove-edge' ? frame.node : undefined);
    stuck.setIds(frame.type === 'end' ? frame.stuckNodeIds : []);
    placed.setId(frame.placedNodeId);
    removed.setIds(frame.removedEdgeIds);
    removing.setId(isRemoval ? frame.edge : undefined);
  };

  return { lens, syncToFrame };
};
