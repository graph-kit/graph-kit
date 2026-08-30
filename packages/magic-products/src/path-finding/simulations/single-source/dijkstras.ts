import { GNode } from '@magic/shared/graph';
import Fraction from 'fraction.js';

import { Arc, arcsBySource, pathTo } from '../arcs.ts';
import { Distance } from '../distance.ts';
import {
  SingleSourceFrame,
  SingleSourceFunction,
  SingleSourceHighlights,
  SingleSourceStep,
} from './frame.ts';

export const dijkstras: SingleSourceFunction =
  (graph, sourceNodeId) => (frameCollector) => {
    const outgoing = arcsBySource(graph);
    if (!(sourceNodeId in outgoing)) return;

    const distances: Record<GNode['id'], Distance> = {};
    for (const node of graph.nodes.value) distances[node.id] = undefined;
    distances[sourceNodeId] = new Fraction(0);

    const settled = new Set<GNode['id']>();
    /** the arc each node's best distance arrived on, which is what draws the tree */
    const arrivedOn = new Map<GNode['id'], Arc>();

    /*
      the frontier is derived rather than kept, so it can never disagree with the
      distances it is ordered by. a real implementation would reach for a heap;
      at this size a sort per frame is cheaper than the bookkeeping a heap needs
      to stay correct as distances improve underneath it
    */
    const frontier = () =>
      Object.keys(distances)
        .filter((id) => !settled.has(id) && distances[id] !== undefined)
        .sort((a, b) => distances[a]!.compare(distances[b]!));

    const frame = <T extends SingleSourceStep>(
      fields: T & SingleSourceHighlights,
    ): SingleSourceFrame => ({
      distances: { ...distances },
      settledNodeIds: [...settled],
      pendingNodeIds: frontier(),
      treeEdgeIds: [...arrivedOn.values()].map((arc) => arc.edgeId),
      anchorNodeId: sourceNodeId,
      ...fields,
    });

    frameCollector.add(frame({ type: 'start', source: sourceNodeId }));

    let settleCount = 0;

    for (;;) {
      const queue = frontier();
      const nearest = queue.at(0);
      if (!nearest) break;

      const holding = (ids: readonly GNode['id'][]) =>
        ids.map((node) => ({ node, distance: distances[node]! }));

      if (settleCount > 0) {
        const runnerUp = queue.at(1);
        frameCollector.add(
          frame({
            type: 'safe-to-settle',
            node: nearest,
            distance: distances[nearest]!,
            runnerUp:
              runnerUp === undefined ? undefined : holding([runnerUp])[0],
            activeNodeId: nearest,
          }),
        );
      }

      settled.add(nearest);
      settleCount++;

      frameCollector.add(
        frame({
          type: 'settle-node',
          node: nearest,
          distance: distances[nearest]!,
          activeNodeId: nearest,
        }),
      );

      const leaving = outgoing[nearest] ?? [];

      /*
        only nodes that cost strictly more than the one just settled are still
        waiting on it. a node tied with it is already as cheap as it can get,
        since a path leaving `nearest` can only add non negative weight on top
        of a cost that already matches, so naming it here would claim a doubt
        that does not exist
      */
      const waiting = queue
        .slice(1)
        .filter((id) => distances[id]!.gt(distances[nearest]!));

      if (waiting.length > 0 && leaving.length > 0) {
        frameCollector.add(
          frame({
            type: 'still-tentative',
            waiting: holding(waiting),
            via: holding([nearest])[0],
            candidateNodeIds: waiting,
          }),
        );
      }

      frameCollector.add(
        frame({
          type: 'explore-node',
          node: nearest,
          distance: distances[nearest]!,
          edges: leaving.map((arc) => arc.edgeId),
          basePath: pathTo(arrivedOn, nearest),
          activeNodeId: nearest,
        }),
      );

      for (const arc of leaving) {
        const offered = distances[nearest]!.add(arc.weight);
        const current = distances[arc.to];

        if (settled.has(arc.to)) {
          frameCollector.add(
            frame({
              type: 'skip-settled',
              edge: arc.edgeId,
              node: arc.to,
              distance: current!,
              activeNodeId: nearest,
              rejectedEdgeIds: [arc.edgeId],
            }),
          );
          continue;
        }

        frameCollector.add(
          frame({
            type: 'relax-edge',
            edge: arc.edgeId,
            from: arc.from,
            to: arc.to,
            base: distances[nearest]!,
            offered,
            activeNodeId: nearest,
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
              activeNodeId: nearest,
              candidateNodeIds: [arc.to],
              rejectedEdgeIds: [arc.edgeId],
            }),
          );
          continue;
        }

        /*
          a settled neighbor is relaxed like any other rather than skipped. with
          non negative weights it always keeps its distance, so the skip would
          save nothing; with a negative weight it improves, and watching a
          finalized node move is the whole reason dijkstra bans them
        */
        // read before the arc is replaced, or the route being beaten is already gone
        const oldPath = pathTo(arrivedOn, arc.to);

        distances[arc.to] = offered;
        arrivedOn.set(arc.to, arc);

        frameCollector.add(
          frame({
            type: 'improve-distance',
            node: arc.to,
            oldDistance: current,
            newDistance: offered,
            via: nearest,
            base: distances[nearest]!,
            edge: arc.edgeId,
            oldPath,
            activeNodeId: nearest,
            candidateNodeIds: [arc.to],
            relaxingEdgeIds: [arc.edgeId],
          }),
        );
      }
    }

    const unreachable = Object.keys(distances).filter(
      (id) => distances[id] === undefined,
    );

    if (unreachable.length > 0) {
      frameCollector.add(frame({ type: 'unreachable', nodes: unreachable }));
    }

    frameCollector.add(frame({ type: 'end' }));
  };
