import { GNode } from '@magic/shared/graph';
import Fraction from 'fraction.js';

import { Distance } from '../distance.ts';
import {
  AllPairsFrame,
  AllPairsFunction,
  AllPairsHighlights,
  AllPairsStep,
} from './frame.ts';

export const floydWarshall: AllPairsFunction = (graph) => (frameCollector) => {
  const nodeIds = graph.nodes.value.map((node) => node.id);

  const matrix: Record<GNode['id'], Record<GNode['id'], Distance>> = {};
  for (const from of nodeIds) {
    matrix[from] = {};
    for (const to of nodeIds)
      matrix[from][to] = from === to ? new Fraction(0) : undefined;
  }

  /*
    parallel edges collapse to the cheapest one, since a path taking the dearer
    of two edges between the same pair is never the shortest. a negative self
    loop is allowed to undercut the zero on the diagonal, which is how the
    cheapest cycle through a node shows up there
  */
  for (const edge of graph.edges.value) {
    const known = matrix[edge.source]?.[edge.target];
    if (known !== undefined && known.lte(edge.weight)) continue;
    matrix[edge.source][edge.target] = edge.weight;
  }

  const frame = <T extends AllPairsStep>(
    fields: T & AllPairsHighlights,
  ): AllPairsFrame => ({
    matrix: Object.fromEntries(
      nodeIds.map((from) => [from, { ...matrix[from] }]),
    ),
    ...fields,
  });

  frameCollector.add(frame({ type: 'start' }));

  /*
    one frame per cell per pivot, which is cubic in the node count by nature:
    this is what the algorithm does, and thinning it out would be showing a
    different algorithm. the only pairs skipped below are the ones where the
    pivot is an endpoint, since going through the pivot to reach the pivot can
    only be the trip we already have. the diagonal is not skipped: a node that
    finds a way back to itself for less than nothing is the negative cycle
  */
  for (const [index, pivot] of nodeIds.entries()) {
    frameCollector.add(
      frame({
        type: 'choose-pivot',
        node: pivot,
        pivotNumber: index + 1,
        totalPivots: nodeIds.length,
        activeNodeId: pivot,
      }),
    );

    for (const from of nodeIds) {
      const intoPivot = matrix[from][pivot];
      // no way into the pivot means no way through it, for any destination
      if (intoPivot === undefined || from === pivot) continue;

      for (const to of nodeIds) {
        const outOfPivot = matrix[pivot][to];
        if (outOfPivot === undefined || to === pivot) continue;

        const viaPivot = intoPivot.add(outOfPivot);
        const direct = matrix[from][to];

        frameCollector.add(
          frame({
            type: 'consider-pair',
            from,
            to,
            pivot,
            direct,
            viaPivot,
            activeNodeId: pivot,
            candidateNodeIds: [from, to],
          }),
        );

        if (direct !== undefined && direct.lte(viaPivot)) {
          frameCollector.add(
            frame({
              type: 'keep-pair',
              from,
              to,
              pivot,
              distance: direct,
              activeNodeId: pivot,
              candidateNodeIds: [from, to],
            }),
          );
          continue;
        }

        matrix[from][to] = viaPivot;

        frameCollector.add(
          frame({
            type: 'improve-pair',
            from,
            to,
            pivot,
            oldDistance: direct,
            newDistance: viaPivot,
            activeNodeId: pivot,
            candidateNodeIds: [from, to],
          }),
        );
      }
    }
  }

  /*
    a node that can reach itself for less than nothing is sitting on a cycle
    that gets cheaper every lap, so no shortest path through it exists
  */
  const nodeOnNegativeCycle = nodeIds.find((id) => matrix[id][id]?.lt(0));

  if (nodeOnNegativeCycle) {
    frameCollector.add(
      frame({
        type: 'negative-cycle',
        node: nodeOnNegativeCycle,
        candidateNodeIds: [nodeOnNegativeCycle],
      }),
    );
  }

  frameCollector.add(frame({ type: 'end' }));
};
