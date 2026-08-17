import { GEdge, GNode } from '@magic/shared/graph';

import {
  KruskalsFrame,
  KruskalsFunction,
  KruskalsHighlights,
  KruskalsStep,
} from './frame.ts';

export const kruskals: KruskalsFunction = (graph) => (frameCollector) => {
  const nodeIds = graph.nodes.value.map((node) => node.id);

  const parent = new Map<GNode['id'], GNode['id']>();
  const rank = new Map<GNode['id'], number>();
  for (const id of nodeIds) {
    parent.set(id, id);
    rank.set(id, 0);
  }

  const find = (id: GNode['id']): GNode['id'] => {
    const next = parent.get(id)!;
    if (next === id) return id;
    const root = find(next);
    parent.set(id, root);
    return root;
  };

  // true when the two nodes were in different components and are now merged
  const union = (a: GNode['id'], b: GNode['id']): boolean => {
    const rootA = find(a);
    const rootB = find(b);
    if (rootA === rootB) return false;

    const rankA = rank.get(rootA)!;
    const rankB = rank.get(rootB)!;
    if (rankA < rankB) {
      parent.set(rootA, rootB);
    } else if (rankA > rankB) {
      parent.set(rootB, rootA);
    } else {
      parent.set(rootB, rootA);
      rank.set(rootA, rankA + 1);
    }
    return true;
  };

  const edgesSortedByWeight = graph.edges.value.toSorted((a, b) =>
    a.weight.compare(b.weight),
  );
  const sortedEdgeIds = edgesSortedByWeight.map((edge) => edge.id);

  const treeNodes = new Set<GNode['id']>();
  const treeEdges: string[] = [];
  const excludedEdges: string[] = [];

  const frame = (
    fields: KruskalsStep &
      KruskalsHighlights &
      Partial<Pick<KruskalsFrame, 'dimmedEdgeIds'>>,
  ): KruskalsFrame => {
    const decided = new Set([...treeEdges, ...excludedEdges]);
    return {
      treeNodeIds: [...treeNodes],
      treeEdgeIds: [...treeEdges],
      excludedEdgeIds: [...excludedEdges],
      dimmedEdgeIds: [...excludedEdges],
      candidateEdges: sortedEdgeIds.filter((id) => !decided.has(id)),
      ...fields,
    };
  };

  frameCollector.add(frame({ type: 'start' }));

  for (let i = 0; i < edgesSortedByWeight.length; i++) {
    const edge = edgesSortedByWeight[i];

    frameCollector.add(
      frame({
        type: 'consider-edge',
        edge: edge.id,
        activeEdgeId: edge.id,
        activeNodeIds: [edge.source, edge.target],
        selectedEdge: edge.id,
      }),
    );

    if (union(edge.source, edge.target)) {
      frameCollector.add(
        frame({
          type: 'accept-edge',
          edge: edge.id,
          activeEdgeId: edge.id,
          activeNodeIds: [edge.source, edge.target],
          selectedEdge: edge.id,
        }),
      );

      treeEdges.push(edge.id);
      treeNodes.add(edge.source);
      treeNodes.add(edge.target);

      if (treeEdges.length === nodeIds.length - 1) {
        const skipped = edgesSortedByWeight.slice(i + 1).map((e) => e.id);
        if (skipped.length > 0) {
          excludedEdges.push(...skipped);
          frameCollector.add(frame({ type: 'all-connected', edges: skipped }));
        }
        break;
      }
    } else {
      excludedEdges.push(edge.id);
      frameCollector.add(
        frame({
          type: 'reject-edge',
          edge: edge.id,
          excludingEdgeId: edge.id,
          activeNodeIds: [edge.source, edge.target],
          dimmedEdgeIds: excludedEdges.slice(0, -1),
        }),
      );
    }
  }

  const unreachable =
    nodeIds.length > 1 ? nodeIds.filter((id) => !treeNodes.has(id)) : [];

  if (unreachable.length > 0) {
    frameCollector.add(frame({ type: 'unreachable', nodes: unreachable }));
  }

  frameCollector.add(frame({ type: 'end' }));
};
