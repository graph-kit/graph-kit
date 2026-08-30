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
  const treeEdges: GEdge['id'][] = [];
  const excludedEdges: GEdge['id'][] = [];
  // edges before this point have had their turn, so the consideration list is
  // whatever is left from here on
  let considerFrom = 0;

  const frame = (fields: KruskalsStep & KruskalsHighlights): KruskalsFrame => ({
    treeNodeIds: [...treeNodes],
    treeEdgeIds: [...treeEdges],
    excludedEdgeIds: [...excludedEdges],
    candidateEdges: sortedEdgeIds.slice(considerFrom),
    ...fields,
  });

  frameCollector.add(frame({ type: 'start' }));

  for (const [index, edge] of edgesSortedByWeight.entries()) {
    // the edge stays in the consideration list for the frame that decides it,
    // so it can be pointed at as it leaves
    considerFrom = index;
    const decision = {
      edge: edge.id,
      activeNodeIds: [edge.source, edge.target],
      selectedEdge: edge.id,
    };

    frameCollector.add(frame({ type: 'consider-edge', ...decision }));

    if (!union(edge.source, edge.target)) {
      excludedEdges.push(edge.id);
      frameCollector.add(frame({ type: 'exclude-edge', ...decision }));
      continue;
    }

    treeEdges.push(edge.id);
    treeNodes.add(edge.source);
    treeNodes.add(edge.target);
    frameCollector.add(frame({ type: 'accept-edge', ...decision }));

    if (treeEdges.length === nodeIds.length - 1) break;
  }

  // the tree spans every node it can reach, so whatever never got its turn is
  // excluded alongside the edges that would have closed a loop
  const decided = new Set([...treeEdges, ...excludedEdges]);
  excludedEdges.push(...sortedEdgeIds.filter((id) => !decided.has(id)));
  considerFrom = sortedEdgeIds.length;

  const unreachable =
    nodeIds.length > 1 ? nodeIds.filter((id) => !treeNodes.has(id)) : [];

  if (unreachable.length > 0) {
    frameCollector.add(frame({ type: 'unreachable', nodes: unreachable }));
  }

  frameCollector.add(frame({ type: 'end' }));
};
