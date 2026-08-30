import { GEdge, GNode } from '@magic/shared/graph';
import Fraction from 'fraction.js';

import { Distance } from '../distance.ts';
import { edgeIdsAlongPathTo } from '../edges.ts';
import {
  SingleSourceFrame,
  SingleSourceFunction,
  SingleSourceHighlights,
  SingleSourceStep,
} from './frame.ts';

export const bellmanFord: SingleSourceFunction =
  (graph, sourceNodeId) => (frameCollector) => {
    const nodeIds = graph.nodes.value.map((node) => node.id);
    if (!nodeIds.includes(sourceNodeId)) return;

    const allEdges = graph.edges.value;

    const distances: Record<GNode['id'], Distance> = {};
    for (const id of nodeIds) distances[id] = undefined;
    distances[sourceNodeId] = new Fraction(0);

    const arrivalEdgeByNode = new Map<GNode['id'], GEdge>();

    /*
      no frontier and no settled set: bellman ford has neither. it sweeps every
      edge every pass, so the only state worth painting is the distance table
      and the tree the table implies
    */
    const frame = <T extends SingleSourceStep>(
      fields: T & SingleSourceHighlights,
    ): SingleSourceFrame => ({
      distances: { ...distances },
      treeEdgeIds: [...arrivalEdgeByNode.values()].map((edge) => edge.id),
      anchorNodeId: sourceNodeId,
      ...fields,
    });

    frameCollector.add(frame({ type: 'start', source: sourceNodeId }));

    const totalPasses = Math.max(nodeIds.length - 1, 0);

    for (let pass = 1; pass <= totalPasses; pass++) {
      frameCollector.add(frame({ type: 'begin-pass', pass, totalPasses }));

      let improvedThisPass = false;

      for (const edge of allEdges) {
        const reachedFrom = distances[edge.source];
        // an edge leaving a node we cannot reach yet offers nothing, and a frame
        // per such edge would bury the passes that do move under ones that cannot
        if (reachedFrom === undefined) continue;

        const offered = reachedFrom.add(edge.weight);
        const current = distances[edge.target];

        frameCollector.add(
          frame({
            type: 'relax-edge',
            edge: edge.id,
            from: edge.source,
            to: edge.target,
            base: reachedFrom,
            offered,
            activeNodeId: edge.source,
            candidateNodeIds: [edge.target],
            relaxingEdgeIds: [edge.id],
          }),
        );

        if (current !== undefined && current.lte(offered)) {
          frameCollector.add(
            frame({
              type: 'keep-distance',
              node: edge.target,
              distance: current,
              offered,
              edge: edge.id,
              basePath: edgeIdsAlongPathTo(arrivalEdgeByNode, edge.source),
              currentPath: edgeIdsAlongPathTo(arrivalEdgeByNode, edge.target),
              activeNodeId: edge.source,
              candidateNodeIds: [edge.target],
              rejectedEdgeIds: [edge.id],
            }),
          );
          continue;
        }

        // read before the arrival edge is replaced, or the route being beaten is
        // already gone, and the route the new cost is built on already rewritten
        const oldPath = edgeIdsAlongPathTo(arrivalEdgeByNode, edge.target);
        const basePath = edgeIdsAlongPathTo(arrivalEdgeByNode, edge.source);

        distances[edge.target] = offered;
        arrivalEdgeByNode.set(edge.target, edge);
        improvedThisPass = true;

        frameCollector.add(
          frame({
            type: 'improve-distance',
            node: edge.target,
            oldDistance: current,
            newDistance: offered,
            via: edge.source,
            base: reachedFrom,
            basePath,
            edge: edge.id,
            oldPath,
            activeNodeId: edge.source,
            candidateNodeIds: [edge.target],
            relaxingEdgeIds: [edge.id],
          }),
        );
      }

      if (improvedThisPass) continue;

      frameCollector.add(frame({ type: 'pass-settled', pass }));
      break;
    }

    /*
      the extra sweep. after n-1 passes every shortest path that exists has been
      found, so an edge that still improves proves a cycle a walker could loop
      forever to keep getting cheaper. one such edge is proof enough
    */
    const stillImprovingEdge = allEdges.find((edge) => {
      const reachedFrom = distances[edge.source];
      if (reachedFrom === undefined) return false;
      const current = distances[edge.target];
      return current === undefined || reachedFrom.add(edge.weight).lt(current);
    });

    if (stillImprovingEdge) {
      frameCollector.add(
        frame({
          type: 'negative-cycle',
          node: stillImprovingEdge.target,
          activeNodeId: stillImprovingEdge.source,
          candidateNodeIds: [stillImprovingEdge.target],
          relaxingEdgeIds: [stillImprovingEdge.id],
        }),
      );
      frameCollector.add(frame({ type: 'end' }));
      return;
    }

    const unreachable = nodeIds.filter((id) => distances[id] === undefined);

    if (unreachable.length > 0) {
      frameCollector.add(frame({ type: 'unreachable', nodes: unreachable }));
    }

    // nothing was final until the last pass, so everything reached becomes
    // final all at once rather than one node at a time the way dijkstra does it
    frameCollector.add(
      frame({
        type: 'end',
        settledNodeIds: nodeIds.filter((id) => distances[id] !== undefined),
      }),
    );
  };
