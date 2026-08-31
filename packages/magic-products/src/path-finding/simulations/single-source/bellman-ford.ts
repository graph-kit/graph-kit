import { GEdge, GNode } from '@magic/shared/graph';
import Fraction from 'fraction.js';

import { Distance } from '../distance.ts';
import {
  edgeIdsAlongPathTo,
  nodeOnCycleFrom,
  traceCycleFrom,
} from '../edges.ts';
import {
  SingleSourceFrame,
  SingleSourceFunction,
  SingleSourceHighlights,
  SingleSourceStep,
  SingleSourceSweep,
  SweepOutcome,
} from './frame.ts';

export const bellmanFord: SingleSourceFunction =
  (graph, sourceNodeId) => (frameCollector) => {
    const nodeIds = graph.nodes.value.map((node) => node.id);
    if (!nodeIds.includes(sourceNodeId)) return;

    const allEdges = graph.edges.value;
    const sweepEdgeIds = allEdges.map((edge) => edge.id);

    const distances: Record<GNode['id'], Distance> = {};
    for (const id of nodeIds) distances[id] = undefined;
    distances[sourceNodeId] = new Fraction(0);

    const arrivalEdgeByNode = new Map<GNode['id'], GEdge>();

    const changedThisPass = new Set<GNode['id']>();

    const totalPasses = Math.max(nodeIds.length - 1, 0);

    let sweep: SingleSourceSweep['sweep'];

    const beginSweep = (pass?: number) =>
      (sweep = {
        edgeIds: sweepEdgeIds,
        position: 0,
        pass,
        totalPasses,
        outcomes: {},
      });

    const atEdge = (index: number) => {
      if (sweep) sweep.position = index + 1;
    };

    const record = (edge: GEdge, outcome: SweepOutcome) => {
      if (sweep) sweep.outcomes[edge.id] = outcome;
    };

    const endSweep = () => (sweep = undefined);

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
      sweep: sweep && { ...sweep, outcomes: { ...sweep.outcomes } },
      ...fields,
    });

    const skipUnreachable = (edge: GEdge) => {
      record(edge, 'skipped');
      frameCollector.add(
        frame({
          type: 'skip-unreachable',
          edge: edge.id,
          from: edge.source,
          to: edge.target,
          rejectedEdgeIds: [edge.id],
        }),
      );
    };

    const reportTheCycle = (provingEdge: GEdge) => {
      const proof = {
        type: 'negative-cycle' as const,
        node: provingEdge.target,
        edge: provingEdge.id,
        activeNodeId: provingEdge.source,
        candidateNodeIds: [provingEdge.target],
        relaxingEdgeIds: [provingEdge.id],
      };

      const onCycle = nodeOnCycleFrom(
        arrivalEdgeByNode,
        provingEdge.target,
        nodeIds.length,
      );

      const cycleEdges =
        onCycle === undefined
          ? undefined
          : traceCycleFrom(arrivalEdgeByNode, onCycle, nodeIds.length);

      if (onCycle === undefined || cycleEdges === undefined) {
        frameCollector.add(frame(proof));
        frameCollector.add(frame({ type: 'end' }));
        return;
      }

      const painted = {
        cycleNodeIds: cycleEdges.map((edge) => edge.target),
        cycleEdgeIds: cycleEdges.map((edge) => edge.id),
      };

      frameCollector.add(
        frame({
          ...proof,
          loop: {
            edges: painted.cycleEdgeIds,
            lapCost: cycleEdges.reduce(
              (total, edge) => total.add(edge.weight),
              new Fraction(0),
            ),
          },
          ...painted,
        }),
      );

      frameCollector.add(frame({ type: 'end', ...painted }));
    };

    frameCollector.add(frame({ type: 'start', source: sourceNodeId }));

    let provedByFixpoint = false;

    for (let pass = 1; pass <= totalPasses; pass++) {
      beginSweep(pass);
      frameCollector.add(
        frame({
          type: 'begin-pass',
          pass,
          totalPasses,
          nodeCount: nodeIds.length,
        }),
      );

      changedThisPass.clear();

      for (const [index, edge] of allEdges.entries()) {
        atEdge(index);

        const reachedFrom = distances[edge.source];

        if (reachedFrom === undefined) {
          skipUnreachable(edge);
          continue;
        }

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
          record(edge, 'kept');
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

        record(edge, 'improved');
        changedThisPass.add(edge.target);

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

      if (changedThisPass.size > 0) continue;

      endSweep();
      frameCollector.add(frame({ type: 'pass-settled', pass }));
      provedByFixpoint = true;
      break;
    }

    // check sweep
    if (!provedByFixpoint && totalPasses > 0) {
      beginSweep();
      frameCollector.add(
        frame({
          type: 'begin-verification',
          passesDone: totalPasses,
          nodeCount: nodeIds.length,
        }),
      );

      for (const [index, edge] of allEdges.entries()) {
        atEdge(index);

        const reachedFrom = distances[edge.source];

        if (reachedFrom === undefined) {
          skipUnreachable(edge);
          continue;
        }

        const offered = reachedFrom.add(edge.weight);
        const current = distances[edge.target];

        if (current === undefined || offered.lt(current)) {
          record(edge, 'improved');
          arrivalEdgeByNode.set(edge.target, edge);
          endSweep();
          reportTheCycle(edge);
          return;
        }

        record(edge, 'kept');
        frameCollector.add(
          frame({
            type: 'verify-edge',
            edge: edge.id,
            from: edge.source,
            to: edge.target,
            offered,
            current,
            currentPath: edgeIdsAlongPathTo(arrivalEdgeByNode, edge.target),
            activeNodeId: edge.source,
            candidateNodeIds: [edge.target],
            relaxingEdgeIds: [edge.id],
          }),
        );
      }

      endSweep();
      frameCollector.add(frame({ type: 'no-negative-cycle' }));
    }

    endSweep();

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
