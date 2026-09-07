import { GEdge, GNode } from '@magic/shared/graph';

import {
  PrimsFrame,
  PrimsFunction,
  PrimsHighlights,
  PrimsStep,
} from './frame.ts';

export const prims: PrimsFunction =
  (graph, startNodeId) => (frameCollector) => {
    const nodeIds = graph.nodes.value.map((node) => node.id);
    if (!nodeIds.includes(startNodeId)) return;

    const inTree = new Set<GNode['id']>([startNodeId]);
    const treeEdges: GEdge['id'][] = [];
    const excludedEdges: GEdge['id'][] = [];

    const farNode = (edge: Pick<GEdge, 'source' | 'target'>) =>
      inTree.has(edge.source) ? edge.target : edge.source;

    let candidateEdges: GEdge[] = [];

    const growTree = (node: GNode['id']) => {
      inTree.add(node);

      // candidates this call rules out so the caller can announce why
      const newlyExcluded: GEdge['id'][] = [];

      const stillCandidates: GEdge[] = [];

      for (const edge of candidateEdges) {
        if (inTree.has(edge.source) !== inTree.has(edge.target)) {
          stillCandidates.push(edge);
          continue;
        }
        if (edge.id !== treeEdges.at(-1)) {
          newlyExcluded.push(edge.id);
        }
      }
      candidateEdges = stillCandidates;

      const alreadyTracked = new Set(candidateEdges.map((edge) => edge.id));
      for (const edge of graph.edges.value) {
        if (edge.source !== node && edge.target !== node) continue;
        if (alreadyTracked.has(edge.id)) continue;
        const other = edge.source === node ? edge.target : edge.source;
        if (inTree.has(other)) continue;
        candidateEdges.push(edge);
      }

      return newlyExcluded;
    };

    const frame = (fields: PrimsStep & PrimsHighlights): PrimsFrame => ({
      treeNodeIds: [...inTree],
      treeEdgeIds: [...treeEdges],
      excludedEdgeIds: [...excludedEdges],
      candidateEdges: candidateEdges.map((edge) => edge.id),
      anchorNodeId: startNodeId,
      ...fields,
    });

    frameCollector.add(frame({ type: 'start' }));

    growTree(startNodeId);

    while (candidateEdges.length > 0) {
      frameCollector.add(frame({ type: 'consider-edges' }));

      let cheapestSoFar = candidateEdges[0];
      for (let i = 1; i < candidateEdges.length; i++) {
        const challenger = candidateEdges[i];
        // lt = less than
        if (challenger.weight.lt(cheapestSoFar.weight))
          cheapestSoFar = challenger;
      }

      const tied = candidateEdges.filter((edge) =>
        edge.weight.equals(cheapestSoFar.weight),
      );
      const winner = tied[0];
      const winnerNode = farNode(winner);

      frameCollector.add(
        frame({
          type: 'select-edge',
          edge: winner.id,
          tiedEdges: tied.length > 1 ? tied.map((edge) => edge.id) : undefined,
          activeNodeIds: [winner.source, winner.target],
          selectedEdge: winner.id,
        }),
      );

      treeEdges.push(winner.id);
      const newlyExcluded = growTree(winnerNode);

      if (newlyExcluded.length > 0) {
        const endpoints = newlyExcluded.flatMap((id) => {
          const edge = graph.getEdge(id);
          return [edge.source, edge.target];
        });

        excludedEdges.push(...newlyExcluded);
        frameCollector.add(
          frame({
            type: 'exclude-edges',
            edges: newlyExcluded,
            activeNodeIds: [...new Set(endpoints)],
          }),
        );
      }
    }

    const unreachable = nodeIds.filter((id) => !inTree.has(id));

    if (unreachable.length > 0) {
      frameCollector.add(frame({ type: 'unreachable', nodes: unreachable }));
    }

    frameCollector.add(frame({ type: 'end' }));
  };
