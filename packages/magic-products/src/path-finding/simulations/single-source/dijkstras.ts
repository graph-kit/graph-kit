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

    const routeTo = (node: GNode['id']) =>
      edgeIdsAlongPathTo(arrivalEdgeByNode, node);

    const frontier = () =>
      Object.keys(distances)
        .filter((id) => !settled.has(id) && distances[id] !== undefined)
        .sort((a, b) => distances[a]!.compare(distances[b]!));

    const frontierEntry = (node: GNode['id']) => ({
      node,
      distance: distances[node]!,
      path: routeTo(node),
    });

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

    for (;;) {
      const queue = frontier();
      const nearest = queue.at(0);
      if (!nearest) break;

      if (settled.size > 0) {
        const runnerUp = queue.at(1);
        frameCollector.add(
          frame({
            type: 'safe-to-settle',
            node: nearest,
            distance: distances[nearest]!,
            path: routeTo(nearest),
            runnerUp:
              runnerUp === undefined ? undefined : frontierEntry(runnerUp),
            activeNodeId: nearest,
          }),
        );
      }

      settled.add(nearest);

      // the start node is handed its distance of 0 by the frame that opens the
      // run, so settling it tells the reader nothing they were not just told
      if (nearest !== sourceNodeId) {
        frameCollector.add(
          frame({
            type: 'settle-node',
            node: nearest,
            distance: distances[nearest]!,
            path: routeTo(nearest),
            activeNodeId: nearest,
          }),
        );
      }

      const leaving = edgesLeaving.get(nearest) ?? [];
      // edges landing on a finalized node cannot improve anything, so they are
      // passed over without a frame rather than shown being turned down
      const followable = leaving.filter((edge) => !settled.has(edge.target));

      const waiting = queue
        .slice(1)
        .filter((id) => distances[id]!.gt(distances[nearest]!));

      if (waiting.length > 0 && followable.length > 0) {
        frameCollector.add(
          frame({
            type: 'still-tentative',
            waiting: waiting.map((node) => frontierEntry(node)),
            via: frontierEntry(nearest),
            candidateNodeIds: waiting,
          }),
        );
      }

      const worthAnnouncing = followable.length > 1 || leaving.length === 0;

      if (worthAnnouncing) {
        frameCollector.add(
          frame({
            type: 'explore-node',
            node: nearest,
            distance: distances[nearest]!,
            edges: followable.map((edge) => edge.id),
            basePath: routeTo(nearest),
            activeNodeId: nearest,
          }),
        );
      }

      for (const edge of followable) {
        const offered = distances[nearest]!.add(edge.weight);
        const current = distances[edge.target];

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
              offeredPath: [...routeTo(nearest), edge.id],
              currentPath: routeTo(edge.target),
              activeNodeId: nearest,
              candidateNodeIds: [edge.target],
              rejectedEdgeIds: [edge.id],
            }),
          );
          continue;
        }

        // read before the arrival edge is replaced, or the route being beaten is
        // already gone, and the route the new cost is built on already rewritten
        const oldPath = routeTo(edge.target);
        const basePath = routeTo(nearest);

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
