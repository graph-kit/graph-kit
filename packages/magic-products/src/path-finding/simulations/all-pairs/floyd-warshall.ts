import { GNode, GraphPath, walkFromTo, walkLoopAt } from '@magic/shared/graph';
import Fraction from 'fraction.js';

import { Distance } from '../distance.ts';
import {
  AllPairsFrame,
  AllPairsFunction,
  AllPairsHighlights,
  AllPairsStep,
} from './frame.ts';
import { RouteTrail, routeBetween } from './routeTrail.ts';

export const floydWarshall: AllPairsFunction = (graph) => (frameCollector) => {
  const nodeIds = graph.nodes.value.map((node) => node.id);

  const matrix: Record<GNode['id'], Record<GNode['id'], Distance>> = {};
  const routes: Record<GNode['id'], Record<GNode['id'], GraphPath>> = {};

  for (const from of nodeIds) {
    matrix[from] = {};
    routes[from] = {};
    for (const to of nodeIds)
      matrix[from][to] = from === to ? new Fraction(0) : undefined;
  }

  for (const edge of graph.edges.value) {
    const cheapestKnown = matrix[edge.source]?.[edge.target];
    if (cheapestKnown !== undefined && cheapestKnown.lte(edge.weight)) continue;
    matrix[edge.source][edge.target] = edge.weight;
    routes[edge.source][edge.target] = [edge.id];
  }

  // a route is replaced rather than edited, so the rows are all a frame has to copy
  const trailSnapshot = (): RouteTrail =>
    Object.fromEntries(nodeIds.map((from) => [from, { ...routes[from] }]));

  const routeFor = (from: GNode['id'], to: GNode['id']) =>
    routeBetween(graph, routes, from, to);

  /** the two legs of a trip through the pivot, laid end to end */
  const detourVia = (
    from: GNode['id'],
    pivot: GNode['id'],
    to: GNode['id'],
  ): GraphPath => [...routeFor(from, pivot), ...routeFor(pivot, to)];

  /**
   * whether a detour is a trip anyone can take: the legs chain into the pair
   * asked about, and it does not double back through a node it has been to
   */
  const isTrip = (
    detour: GraphPath,
    from: GNode['id'],
    to: GNode['id'],
  ): boolean => {
    const walk = walkFromTo(graph, detour, from, to);
    return walk !== undefined && !walk.repeatsANode;
  };

  const frame = <T extends AllPairsStep>(
    fields: T & AllPairsHighlights,
  ): AllPairsFrame => ({
    matrix: Object.fromEntries(
      nodeIds.map((from) => [from, { ...matrix[from] }]),
    ),
    routes: trailSnapshot(),
    ...fields,
  });

  const reportNegativeCycle = (node: GNode['id']) => {
    const lap = walkLoopAt(graph, routeFor(node, node), node);

    const cycleHighlights: AllPairsHighlights = lap
      ? {
          cycleNodeIds: lap.nodeIds,
          cycleEdgeIds: lap.edges.map((edge) => edge.id),
        }
      : { cycleNodeIds: [node] };

    frameCollector.add(
      frame({
        ...cycleHighlights,
        type: 'negative-cycle',
        node,
        loop: lap && {
          edges: lap.edges.map((edge) => edge.id),
          lapCost: lap.edges.reduce(
            (total, edge) => total.add(edge.weight),
            new Fraction(0),
          ),
        },
      }),
    );

    frameCollector.add(frame({ type: 'end', ...cycleHighlights }));
  };

  frameCollector.add(frame({ type: 'start' }));

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
      if (intoPivot === undefined || from === pivot) continue;

      for (const to of nodeIds) {
        const outOfPivot = matrix[pivot][to];
        if (outOfPivot === undefined || to === pivot) continue;

        const detourDistance = intoPivot.add(outOfPivot);
        const currentDistance = matrix[from][to];

        // read before the cell is rewritten, or the route being beaten is gone
        const currentRoute = routeFor(from, to);

        /*
          the whole walk through the pivot, which the cell takes on when the
          detour wins so that its number and its route go on agreeing, and the
          part of it worth showing, which is nothing when it doubles back
        */
        const detourPath = detourVia(from, pivot, to);
        const detourRoute = isTrip(detourPath, from, to) ? detourPath : [];

        /** what the cell holds onto, absent when the detour is about to win */
        const keptDistance =
          currentDistance !== undefined && currentDistance.lte(detourDistance)
            ? currentDistance
            : undefined;

        // a losing detour that is not even a trip is passed over in silence
        if (keptDistance !== undefined && detourRoute.length === 0) continue;

        const pairUnderTest = {
          from,
          to,
          pivot,
          detourDistance,
          detourRoute,
          activeNodeId: pivot,
          candidateNodeIds: [from, to],
        };

        frameCollector.add(
          frame({
            ...pairUnderTest,
            type: 'consider-pair',
            currentDistance,
            currentRoute,
            routeEdgeIds: currentRoute,
            detourEdgeIds: detourRoute,
          }),
        );

        if (keptDistance !== undefined) {
          frameCollector.add(
            frame({
              ...pairUnderTest,
              type: 'keep-pair',
              currentDistance: keptDistance,
              currentRoute,
              routeEdgeIds: currentRoute,
              rejectedEdgeIds: detourRoute,
            }),
          );
          continue;
        }

        matrix[from][to] = detourDistance;
        routes[from][to] = detourPath;

        frameCollector.add(
          frame({
            ...pairUnderTest,
            type: 'improve-pair',
            previousDistance: currentDistance,
            previousRoute: currentRoute,
            routeEdgeIds: detourRoute,
            rejectedEdgeIds: currentRoute,
          }),
        );

        /*
          the diagonal starts at zero, so the only way a cell can improve on
          itself is by getting back for less than nothing. that is the whole
          proof, and every pivot after it would be filling in a table no
          answer survives
        */
        if (from === to) {
          reportNegativeCycle(from);
          return;
        }
      }
    }
  }

  const unreachablePairs = nodeIds.flatMap((from) =>
    nodeIds.filter((to) => to !== from && matrix[from][to] === undefined),
  );

  if (unreachablePairs.length > 0) {
    frameCollector.add(
      frame({
        type: 'unreachable',
        pairs: unreachablePairs.length,
        totalPairs: nodeIds.length * (nodeIds.length - 1),
      }),
    );
  }

  frameCollector.add(frame({ type: 'end' }));
};
