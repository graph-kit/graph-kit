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

    // edges that will no longer be considered
    const excludedEdges: GEdge['id'][] = [];

    const farNode = (edge: Pick<GEdge, 'source' | 'target'>) =>
      inTree.has(edge.source) ? edge.target : edge.source;

    const treeNode = (edge: Pick<GEdge, 'source' | 'target'>) =>
      inTree.has(edge.source) ? edge.source : edge.target;

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

    const frame = <T extends PrimsStep>(
      fields: T & PrimsHighlights,
    ): PrimsFrame => ({
      treeNodeIds: [...inTree],
      treeEdgeIds: [...treeEdges],
      excludedEdgeIds: [...excludedEdges],
      anchorNodeId: startNodeId,
      ...fields,
    });

    frameCollector.add(
      frame({ type: 'start', start: startNodeId, activeNodeId: startNodeId }),
    );

    growTree(startNodeId);

    while (candidateEdges.length > 0) {
      const candidateEdgeIds = candidateEdges.map((edge) => edge.id);
      const candidateNodeIds = [...new Set(candidateEdges.map(farNode))];

      /*
      no activeNodeId here on purpose: candidates can come from several
      different tree nodes at once, so there is no single node to point to
      yet. pinning it to "whichever node grew the tree last" would draw the
      eye to a spot that may have nothing to do with whichever edge turns out
      cheapest
    */
      frameCollector.add(
        frame({
          type: 'consider-edges',
          edges: candidateEdgeIds,
          pendingNodeIds: candidateNodeIds,
          candidateEdges: candidateEdgeIds,
        }),
      );

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
      /*
      Picking tied[0] here would always favor whichever tied edge happens to
      be earliest in the graph's edge array (creation order). The all
      MST algorithm for the "total cost" chip breaks ties the exact same
      way. A graph with many MST would usually end up with the same "arbitrary" tree almost 
      every run, no matter the start node, even when lots of equally valid MSTs exist. 
      Picking randomly among the tied edges keeps every valid MST reachable
    */
      const winner = tied[Math.floor(Math.random() * tied.length)];
      const winnerNode = farNode(winner);
      const winnerSource = treeNode(winner);

      frameCollector.add(
        frame({
          type: 'select-edge',
          edge: winner.id,
          node: winnerNode,
          tiedEdges: tied.length > 1 ? tied.map((edge) => edge.id) : undefined,
          activeNodeId: winnerSource,
          pendingNodeIds: candidateNodeIds,
          candidateEdges: candidateEdgeIds,
          selectedEdge: winner.id,
        }),
      );

      treeEdges.push(winner.id);
      const newlyExcluded = growTree(winnerNode);

      if (newlyExcluded.length > 0) {
        frameCollector.add(
          frame({
            type: 'excluding-edges',
            edges: newlyExcluded,
            excludingEdges: newlyExcluded,
          }),
        );

        excludedEdges.push(...newlyExcluded);

        frameCollector.add(
          frame({ type: 'exclude-edges', edges: newlyExcluded }),
        );
      }
    }

    const unreachable = nodeIds.filter((id) => !inTree.has(id));

    if (unreachable.length > 0) {
      frameCollector.add(frame({ type: 'unreachable', nodes: unreachable }));
    }

    frameCollector.add(frame({ type: 'end' }));
  };
