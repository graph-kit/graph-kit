import { GEdge, GNode } from '@magic/shared/graph';

import { PrimsFrame, PrimsFunction, PrimsHighlights, PrimsStep } from './frame.ts';

/**
 * Grows a minimum spanning tree from a single start node, keeping the
 * candidate edge set as its own piece of state rather than rescanning the
 * whole graph every round.
 *
 * A candidate is any edge connecting a tree node to a non-tree node. Growing
 * the tree updates that set incrementally: candidates that no longer cross
 * the cut drop out, and the newly grown node's own edges to still-outside
 * nodes join in. The candidate set, the pair currently being weighed against
 * each other, and the edge finally chosen are three separate, explicit
 * pieces of state - none of them touch the edge's actual weight, which stays
 * exactly where it already lives, on the graph edge itself.
 *
 * A graph the start node cannot reach is not swept into a forest the way the
 * batch algorithm in `@graph/algorithms` does it - those nodes are reported
 * as unreachable instead.
 */
export const prims: PrimsFunction = (graph, startNodeId) => (frameCollector) => {
  const nodeIds = graph.nodes.value.map((node) => node.id);
  if (!nodeIds.includes(startNodeId)) return;

  const inTree = new Set<GNode['id']>([startNodeId]);
  const treeEdges: GEdge['id'][] = [];
  /** candidates considered at some point that can never be picked now - see growTree */
  const excludedEdges: GEdge['id'][] = [];

  const farNode = (edge: { source: GNode['id']; target: GNode['id'] }) =>
    inTree.has(edge.source) ? edge.target : edge.source;

  /** the endpoint of a candidate edge that is already in the tree - where the offer is coming from */
  const treeNode = (edge: { source: GNode['id']; target: GNode['id'] }) =>
    inTree.has(edge.source) ? edge.source : edge.target;

  /**
   * candidates connecting a tree node to a non-tree node. kept as its own
   * list and updated incrementally rather than derived by rescanning
   * `graph.edges.value` every round
   */
  let candidateEdges: (typeof graph.edges.value)[number][] = [];

  /**
   * folds the newly grown node into the tree and brings the candidate set up
   * to date: drop anything that no longer crosses the cut (both ends are now
   * inside), then add the new node's own edges out to whatever is still
   * outside
   */
  const growTree = (node: GNode['id']) => {
    inTree.add(node);

    /** candidates this call rules out, so the caller can announce why */
    const newlyExcluded: GEdge['id'][] = [];

    const stillCandidates: typeof candidateEdges = [];
    for (const edge of candidateEdges) {
      if (inTree.has(edge.source) !== inTree.has(edge.target)) {
        stillCandidates.push(edge);
        continue;
      }
      // both ends are inside the tree now. the one that just connected them
      // became a tree edge already, so anything else in this state would
      // only close a cycle - it can never be picked from here on
      if (edge.id !== treeEdges.at(-1)) {
        excludedEdges.push(edge.id);
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

    /*
      a plain left-to-right scan for the minimum, shown one comparison at a
      time. ties are resolved separately below rather than by whichever edge
      the scan happens to reach first - see the tie-break note there for why
    */
    let cheapestSoFar = candidateEdges[0];
    for (let i = 1; i < candidateEdges.length; i++) {
      const challenger = candidateEdges[i];

      frameCollector.add(
        frame({
          type: 'compare-edges',
          left: cheapestSoFar.id,
          right: challenger.id,
          pendingNodeIds: candidateNodeIds,
          candidateEdges: candidateEdgeIds,
          currentComparison: [cheapestSoFar.id, challenger.id],
        }),
      );

      if (challenger.weight.lt(cheapestSoFar.weight)) cheapestSoFar = challenger;
    }

    const tied = candidateEdges.filter((edge) => edge.weight.equals(cheapestSoFar.weight));
    /*
      picking tied[0] here would always favor whichever tied edge happens to
      sit earliest in the graph's edge array (creation order) - and the batch
      MST algorithm behind the "total cost" chip breaks ties the exact same
      way (a stable sort keeps equal-weight edges in that same array order).
      with that shared bias, a heavily-tied graph would quietly converge on
      the same one "arbitrary" tree almost every run, no matter the start
      node, even when dozens of equally valid MSTs exist. picking randomly
      among the tied edges keeps every valid MST reachable
    */
    const winner = tied[Math.floor(Math.random() * tied.length)];
    const winnerNode = farNode(winner);
    // where the winning offer actually came from, wherever that is in the
    // tree - not necessarily wherever the previous round left off
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
