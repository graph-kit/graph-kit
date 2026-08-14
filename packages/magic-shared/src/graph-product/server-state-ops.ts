import { PatchOp } from '@multiplayer/protocol/server-state';
import Fraction from 'fraction.js';

import { Graph } from '../graph/types.ts';
import { ServerEdge, ServerNode } from './server-state.ts';

/**
 * Ops are produced and consumed at the action boundary, never per element type. Removing
 * a node also removes its dangling edges, so encoding those separately would send two
 * messages for one action and the receiver would derive the second itself first. The
 * provenance flag cannot catch that, since both messages are legitimately outbound.
 */

const nodePath = (nodeId: string): string => `/nodes/${nodeId}`;
const edgePath = (edgeId: string): string => `/edges/${edgeId}`;

export const encodeElementsAdded = (
  graph: Graph,
  added: {
    addedNodes: readonly { id: string }[];
    addedEdges: readonly { id: string }[];
  },
): PatchOp[] => {
  const ops: PatchOp[] = [];

  for (const node of added.addedNodes) {
    const value: ServerNode = {
      position: { ...graph.positions.get(node.id) },
      label: graph.getNode(node.id)?.label ?? '?',
    };
    ops.push({ op: 'add', path: nodePath(node.id), value });
  }

  for (const edge of added.addedEdges) {
    const found = graph.getEdge(edge.id);
    if (!found) continue;
    const value: ServerEdge = {
      source: found.source,
      target: found.target,
      weight: found.weight.toString(),
    };
    ops.push({ op: 'add', path: edgePath(edge.id), value });
  }

  return ops;
};

export const encodeElementsRemoved = (removed: {
  removedNodeIds: readonly string[];
  removedEdgeIds: readonly string[];
}): PatchOp[] => [
  // edges first so the server never holds an edge whose endpoint is already gone
  ...removed.removedEdgeIds.map((edgeId): PatchOp => ({
    op: 'remove',
    path: edgePath(edgeId),
  })),
  ...removed.removedNodeIds.map((nodeId): PatchOp => ({
    op: 'remove',
    path: nodePath(nodeId),
  })),
];

export const encodePositionsCommitted = (
  positions: readonly {
    nodeId: string;
    position: { x: number; y: number; z: number };
  }[],
): PatchOp[] =>
  positions.map((entry) => ({
    op: 'replace',
    path: `${nodePath(entry.nodeId)}/position`,
    value: { ...entry.position },
  }));

export const encodeWeightsChanged = (
  weights: readonly { edgeId: string; weight: { toString: () => string } }[],
): PatchOp[] =>
  weights.map((entry) => ({
    op: 'replace',
    path: `${edgePath(entry.edgeId)}/weight`,
    value: entry.weight.toString(),
  }));

type ParsedPath =
  | { kind: 'node'; id: string; field: null }
  | { kind: 'node'; id: string; field: 'position' | 'label' }
  | { kind: 'edge'; id: string; field: null }
  | { kind: 'edge'; id: string; field: 'weight' }
  | { kind: 'unknown' };

const parsePath = (path: string): ParsedPath => {
  const [, collection, id, field] = path.split('/');
  if (!id) return { kind: 'unknown' };

  if (collection === 'nodes') {
    if (!field) return { kind: 'node', id, field: null };
    if (field === 'position' || field === 'label') {
      return { kind: 'node', id, field };
    }
  }

  if (collection === 'edges') {
    if (!field) return { kind: 'edge', id, field: null };
    if (field === 'weight') return { kind: 'edge', id, field: 'weight' };
  }

  return { kind: 'unknown' };
};

/**
 * Applies an incoming change by making the same mutation the local action would have
 * made, rather than through a separate decode path. Additions and removals are batched
 * into single actions so one inbound message stays one action on this side too.
 */
export const applyOpsToGraph = (graph: Graph, ops: PatchOp[]): void => {
  const addedNodes: { id: string; label: string; x: number; y: number }[] = [];
  const addedEdges: {
    id: string;
    source: string;
    target: string;
    weight: Fraction;
  }[] = [];
  const removedNodeIds: string[] = [];
  const removedEdgeIds: string[] = [];
  const movedNodes: { nodeId: string; update: { x: number; y: number } }[] = [];
  const reweightedEdges: { edgeId: string; update: Fraction }[] = [];
  const relabeledNodes: { nodeId: string; label: string }[] = [];

  for (const op of ops) {
    const parsed = parsePath(op.path);
    if (parsed.kind === 'unknown') continue;

    if (op.op === 'remove') {
      if (parsed.kind === 'node') removedNodeIds.push(parsed.id);
      else removedEdgeIds.push(parsed.id);
      continue;
    }

    if (parsed.kind === 'node' && parsed.field === null) {
      const node = op.value as ServerNode;
      addedNodes.push({
        id: parsed.id,
        label: node.label,
        x: node.position.x,
        y: node.position.y,
      });
      continue;
    }

    if (parsed.kind === 'edge' && parsed.field === null) {
      const edge = op.value as ServerEdge;
      addedEdges.push({
        id: parsed.id,
        source: edge.source,
        target: edge.target,
        weight: new Fraction(edge.weight),
      });
      continue;
    }

    if (parsed.kind === 'node' && parsed.field === 'position') {
      const position = op.value as { x: number; y: number };
      movedNodes.push({ nodeId: parsed.id, update: { ...position } });
      continue;
    }

    if (parsed.kind === 'node' && parsed.field === 'label') {
      relabeledNodes.push({ nodeId: parsed.id, label: String(op.value) });
      continue;
    }

    if (parsed.kind === 'edge' && parsed.field === 'weight') {
      reweightedEdges.push({
        edgeId: parsed.id,
        update: new Fraction(String(op.value)),
      });
    }
  }

  // removals before additions, since an action that replaced an element encodes as both
  if (removedNodeIds.length > 0 || removedEdgeIds.length > 0) {
    graph.actions.removeElements({
      nodes: removedNodeIds.map((id) => ({ id })),
      edges: removedEdgeIds.map((id) => ({ id })),
    });
  }

  if (addedNodes.length > 0 || addedEdges.length > 0) {
    graph.actions.addElements({ nodes: addedNodes, edges: addedEdges });
  }

  if (movedNodes.length > 0) graph.positions.setMany(movedNodes);
  if (reweightedEdges.length > 0) graph.weights.setMany(reweightedEdges);

  if (relabeledNodes.length > 0) graph.nodeLabel.setMany(relabeledNodes);
};
