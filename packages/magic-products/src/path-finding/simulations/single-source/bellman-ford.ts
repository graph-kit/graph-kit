import { GNode } from '@magic/shared/graph';
import Fraction from 'fraction.js';

import { Arc, arcs, pathTo } from '../arcs.ts';
import { Distance } from '../distance.ts';
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

    const allArcs = arcs(graph);

    const distances: Record<GNode['id'], Distance> = {};
    for (const id of nodeIds) distances[id] = undefined;
    distances[sourceNodeId] = new Fraction(0);

    /** the arc each node's best distance arrived on, which is what draws the tree */
    const arrivedOn = new Map<GNode['id'], Arc>();

    /*
      no frontier and no settled set: bellman ford has neither. it sweeps every
      edge every pass, so the only state worth painting is the distance table
      and the tree the table implies
    */
    const frame = <T extends SingleSourceStep>(
      fields: T & SingleSourceHighlights,
    ): SingleSourceFrame => ({
      distances: { ...distances },
      treeEdgeIds: [...arrivedOn.values()].map((arc) => arc.edgeId),
      anchorNodeId: sourceNodeId,
      ...fields,
    });

    frameCollector.add(frame({ type: 'start', source: sourceNodeId }));

    const totalPasses = Math.max(nodeIds.length - 1, 0);

    for (let pass = 1; pass <= totalPasses; pass++) {
      frameCollector.add(frame({ type: 'begin-pass', pass, totalPasses }));

      let improvedThisPass = false;

      for (const arc of allArcs) {
        const reachedFrom = distances[arc.from];
        // an arc leaving a node we cannot reach yet offers nothing, and a frame
        // per such arc would bury the passes that do move under ones that cannot
        if (reachedFrom === undefined) continue;

        const offered = reachedFrom.add(arc.weight);
        const current = distances[arc.to];

        frameCollector.add(
          frame({
            type: 'relax-edge',
            edge: arc.edgeId,
            from: arc.from,
            to: arc.to,
            base: reachedFrom,
            offered,
            activeNodeId: arc.from,
            candidateNodeIds: [arc.to],
            relaxingEdgeIds: [arc.edgeId],
          }),
        );

        if (current !== undefined && current.lte(offered)) {
          frameCollector.add(
            frame({
              type: 'keep-distance',
              node: arc.to,
              distance: current,
              offered,
              activeNodeId: arc.from,
              candidateNodeIds: [arc.to],
              rejectedEdgeIds: [arc.edgeId],
            }),
          );
          continue;
        }

        // read before the arc is replaced, or the route being beaten is already gone
        const oldPath = pathTo(arrivedOn, arc.to);

        distances[arc.to] = offered;
        arrivedOn.set(arc.to, arc);
        improvedThisPass = true;

        frameCollector.add(
          frame({
            type: 'improve-distance',
            node: arc.to,
            oldDistance: current,
            newDistance: offered,
            via: arc.from,
            base: reachedFrom,
            edge: arc.edgeId,
            oldPath,
            activeNodeId: arc.from,
            candidateNodeIds: [arc.to],
            relaxingEdgeIds: [arc.edgeId],
          }),
        );
      }

      if (improvedThisPass) continue;

      frameCollector.add(frame({ type: 'pass-settled', pass }));
      break;
    }

    /*
      the extra sweep. after n-1 passes every shortest path that exists has been
      found, so an arc that still improves proves a cycle a walker could loop
      forever to keep getting cheaper. one such arc is proof enough
    */
    const looping = allArcs.find((arc) => {
      const reachedFrom = distances[arc.from];
      if (reachedFrom === undefined) return false;
      const current = distances[arc.to];
      return current === undefined || reachedFrom.add(arc.weight).lt(current);
    });

    if (looping) {
      frameCollector.add(
        frame({
          type: 'negative-cycle',
          node: looping.to,
          activeNodeId: looping.from,
          candidateNodeIds: [looping.to],
          relaxingEdgeIds: [looping.edgeId],
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
