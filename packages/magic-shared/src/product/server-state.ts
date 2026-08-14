import { ServerState } from '@multiplayer/protocol/server-state';

/**
 * The server's copy of a graph product, which the local graph mirrors. Deliberately not
 * transit's shape: transit's parallel arrays would force index based paths like
 * /core/nodePositions/3, and those indices drift between clients. Keying everything
 * about a node under its own id keeps /nodes/abc123/position valid regardless of order.
 */
export type GraphServerState = {
  nodes: Record<string, ServerNode>;
  edges: Record<string, ServerEdge>;
  /** verbatim payloads for synced plugins this mapping has no special knowledge of */
  plugins: Record<string, unknown>;
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

/**
 * camera is explicitly local, so the canvas payload never enters the room. syncing it
 * would yank every participant's viewport on each remote change.
 */
const LOCAL_ONLY_PLUGINS = new Set(['canvas']);

/** plugins this mapping folds into nodes and edges rather than passing through */
const MERGED_PLUGINS = new Set(['core', 'nodeLabel']);

type TransitPayload = Record<string, unknown>;

type CorePayload = {
  nodes: { id: string }[];
  edges: { id: string; source: string; target: string }[];
  edgeWeights: { id: string; weight: string }[];
  nodePositions: {
    id: string;
    position: { x: number; y: number; z: number };
  }[];
};

type NodeLabelPayload = { nodeId: string; label: string }[];

const DEFAULT_POSITION = { x: 0, y: 0, z: 0 };
const DEFAULT_LABEL = '?';
const DEFAULT_WEIGHT = '1';

export const serverStateFromTransit = (
  payload: TransitPayload,
): GraphServerState => {
  const core = payload.core as CorePayload;
  const labels = (payload.nodeLabel ?? []) as NodeLabelPayload;

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
      position: { ...DEFAULT_POSITION, ...nodeIdToPosition.get(node.id) },
      label: nodeIdToLabel.get(node.id) ?? DEFAULT_LABEL,
    };
  }

  const edges: Record<string, ServerEdge> = {};
  for (const edge of core.edges) {
    edges[edge.id] = {
      source: edge.source,
      target: edge.target,
      weight: edgeIdToWeight.get(edge.id) ?? DEFAULT_WEIGHT,
    };
  }

  const plugins: Record<string, unknown> = {};
  for (const [pluginName, pluginPayload] of Object.entries(payload)) {
    if (MERGED_PLUGINS.has(pluginName)) continue;
    if (LOCAL_ONLY_PLUGINS.has(pluginName)) continue;
    plugins[pluginName] = pluginPayload;
  }

  return { nodes, edges, plugins };
};

/**
 * the inverse, splitting back into transit's per plugin arrays. local payload supplies
 * the sections the room deliberately does not carry, so a resync never disturbs the
 * camera the user has set.
 */
export const transitFromServerState = <Payload extends TransitPayload>(
  serverState: GraphServerState,
  localPayload: Payload,
): Payload => {
  const nodeEntries = Object.entries(serverState.nodes);
  const edgeEntries = Object.entries(serverState.edges);

  const core: CorePayload = {
    nodes: nodeEntries.map(([id]) => ({ id })),
    edges: edgeEntries.map(([id, edge]) => ({
      id,
      source: edge.source,
      target: edge.target,
    })),
    edgeWeights: edgeEntries.map(([id, edge]) => ({ id, weight: edge.weight })),
    nodePositions: nodeEntries.map(([id, node]) => ({
      id,
      position: node.position,
    })),
  };

  const nodeLabel: NodeLabelPayload = nodeEntries.map(([id, node]) => ({
    nodeId: id,
    label: node.label,
  }));

  const payload: TransitPayload = { ...serverState.plugins, core, nodeLabel };

  for (const pluginName of LOCAL_ONLY_PLUGINS) {
    if (pluginName in localPayload) {
      payload[pluginName] = localPayload[pluginName];
    }
  }

  // the local payload is a real encode from this graph, so the reconstruction carries
  // every key it did: the merged sections rebuilt, the rest passed through untouched
  return payload as Payload;
};

/** reports only: the multiplayer layer owns what a false means, and the recovery */
export const isGraphServerState = (
  state: ServerState,
): state is GraphServerState =>
  typeof state === 'object' &&
  state !== null &&
  'nodes' in state &&
  'edges' in state;
