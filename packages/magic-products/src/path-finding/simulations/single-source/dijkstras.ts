import { GEdge, GNode } from '@magic/shared/graph';
import Fraction from 'fraction.js';

import { Distance } from '../distance.ts';
import { edgeIdsAlongPathTo, edgesLeavingEachNode } from '../edges.ts';
import {
  SingleSourceFrame,
  SingleSourceFunction,
  SingleSourceHighlights,
  SingleSourceStep,
} from './frame.ts';

export const dijkstras: SingleSourceFunction =
  (graph, sourceNodeId) => (frameCollector) => {
    const edgesLeaving = edgesLeavingEachNode(graph);
    if (!edgesLeaving.has(sourceNodeId)) return;

    const distances: Record<GNode['id'], Distance> = {};
    for (const node of graph.nodes.value) distances[node.id] = undefined;
    distances[sourceNodeId] = new Fraction(0);

    const settled = new Set<GNode['id']>();
    const arrivalEdgeByNode = new Map<GNode['id'], GEdge>();

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
      treeEdgeIds: [...arrivalEdgeByNode.values()].map((edge) => edge.id),
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
        ids.map((node) => ({
          node,
          distance: distances[node]!,
          path: edgeIdsAlongPathTo(arrivalEdgeByNode, node),
        }));

      if (settleCount > 0) {
        const runnerUp = queue.at(1);
        frameCollector.add(
          frame({
            type: 'safe-to-settle',
            node: nearest,
            distance: distances[nearest]!,
            path: edgeIdsAlongPathTo(arrivalEdgeByNode, nearest),
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
          path: edgeIdsAlongPathTo(arrivalEdgeByNode, nearest),
          activeNodeId: nearest,
        }),
      );

      const leaving = edgesLeaving.get(nearest) ?? [];

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
          edges: leaving.map((edge) => edge.id),
          basePath: edgeIdsAlongPathTo(arrivalEdgeByNode, nearest),
          activeNodeId: nearest,
        }),
      );

      for (const edge of leaving) {
        const offered = distances[nearest]!.add(edge.weight);
        const current = distances[edge.target];

        if (settled.has(edge.target)) {
          frameCollector.add(
            frame({
              type: 'skip-settled',
              edge: edge.id,
              node: edge.target,
              distance: current!,
              path: edgeIdsAlongPathTo(arrivalEdgeByNode, edge.target),
              activeNodeId: nearest,
              rejectedEdgeIds: [edge.id],
            }),
          );
          continue;
        }

        frameCollector.add(
          frame({
            type: 'relax-edge',
            edge: edge.id,
            from: edge.source,
            to: edge.target,
            base: distances[nearest]!,
            offered,
            activeNodeId: nearest,
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
              offeredPath: [
                ...edgeIdsAlongPathTo(arrivalEdgeByNode, nearest),
                edge.id,
              ],
              currentPath: edgeIdsAlongPathTo(arrivalEdgeByNode, edge.target),
              activeNodeId: nearest,
              candidateNodeIds: [edge.target],
              rejectedEdgeIds: [edge.id],
            }),
          );
          continue;
        }

        // read before the arrival edge is replaced, or the route being beaten is
        // already gone, and the route the new cost is built on already rewritten
        const oldPath = edgeIdsAlongPathTo(arrivalEdgeByNode, edge.target);
        const basePath = edgeIdsAlongPathTo(arrivalEdgeByNode, nearest);

        distances[edge.target] = offered;
        arrivalEdgeByNode.set(edge.target, edge);

        frameCollector.add(
          frame({
            type: 'improve-distance',
            node: edge.target,
            oldDistance: current,
            newDistance: offered,
            via: nearest,
            base: distances[nearest]!,
            edge: edge.id,
            newPath: [...basePath, edge.id],
            oldPath,
            activeNodeId: nearest,
            candidateNodeIds: [edge.target],
            relaxingEdgeIds: [edge.id],
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
