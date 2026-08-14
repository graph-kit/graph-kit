import { nullThrows } from '@core/utils/assert';
import { ServerState } from '@multiplayer/protocol/server-state';

import { GraphEncode } from '../graph/types.ts';

/** the server's copy, keyed by id rather than transit's arrays so lookups are direct */
export type GraphServerState = {
  nodes: Record<string, ServerNode>;
  edges: Record<string, ServerEdge>;
};

export type ServerNode = {
  position: { x: number; y: number; z: number };
  label: string;
};

export type ServerEdge = {
  source: string;
  target: string;
  weight: string;
};

export const serverStateFromTransit = (
  payload: GraphEncode,
): GraphServerState => {
  const core = payload.core;
  const labels = payload.nodeLabel;

  const nodeIdToPosition = new Map(
    core.nodePositions.map(({ id, position }) => [id, position]),
  );
  const nodeIdToLabel = new Map(
    labels.map(({ nodeId, label }) => [nodeId, label]),
  );
  const edgeIdToWeight = new Map(
    core.edgeWeights.map(({ id, weight }) => [id, weight]),
  );

  const nodes: Record<string, ServerNode> = {};
  for (const node of core.nodes) {
    nodes[node.id] = {
      position: nullThrows(
        nodeIdToPosition.get(node.id),
        `server state: node "${node.id}" has no position`,
      ),
      label: nullThrows(
        nodeIdToLabel.get(node.id),
        `server state: node "${node.id}" has no label`,
      ),
    };
  }

  const edges: Record<string, ServerEdge> = {};
  for (const edge of core.edges) {
    edges[edge.id] = {
      source: edge.source,
      target: edge.target,
      weight: nullThrows(
        edgeIdToWeight.get(edge.id),
        `server state: edge "${edge.id}" has no weight`,
      ),
    };
  }

  return { nodes, edges };
};

/**
 * the inverse, splitting back into transit's per plugin arrays. local payload supplies
 * the sections the room deliberately does not carry, so a resync never disturbs the
 * camera the user has set.
 */
export const transitFromServerState = (
  serverState: GraphServerState,
  localPayload: GraphEncode,
): GraphEncode => {
  const nodeEntries = Object.entries(serverState.nodes);
  const edgeEntries = Object.entries(serverState.edges);

  return {
    core: {
      nodes: nodeEntries.map(([id]) => ({ id })),
      edges: edgeEntries.map(([id, edge]) => ({
        id,
        source: edge.source,
        target: edge.target,
      })),
      edgeWeights: edgeEntries.map(([id, edge]) => ({
        id,
        weight: edge.weight,
      })),
      nodePositions: nodeEntries.map(([id, node]) => ({
        id,
        position: node.position,
      })),
    },

    nodeLabel: nodeEntries.map(([id, node]) => ({
      nodeId: id,
      label: node.label,
    })),

    // syncing the camera would yank every participant's viewport on each remote change
    canvas: localPayload.canvas,
  };
};

/** reports only: the multiplayer layer owns what a false means, and the recovery */
export const isGraphServerState = (
  state: ServerState,
): state is GraphServerState =>
  typeof state === 'object' &&
  state !== null &&
  'nodes' in state &&
  'edges' in state;
