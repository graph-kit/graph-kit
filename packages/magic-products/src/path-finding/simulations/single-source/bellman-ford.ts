import { GEdge, GNode } from '@magic/shared/graph';
import Fraction from 'fraction.js';

import { Distance } from '../distance.ts';
import { nodeOnCycleFrom, traceCycleFrom } from '../edges.ts';
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

    /*
      the route each distance was actually paid on, written down as it is paid
      rather than read back off the arrival edges afterwards. once a negative
      cycle overwrites the arrival edge a node was first reached by, walking
      that chain backwards only ever goes round the loop, so the edges leading
      in from the source are gone. relaxing already knows them: the route to
      the target is the route to the source with the crossed edge on the end
    */
    const routeByNode = new Map<GNode['id'], GEdge['id'][]>([
      [sourceNodeId, []],
    ]);

    const routeTo = (node: GNode['id']) => routeByNode.get(node) ?? [];

    const edgeById = new Map(allEdges.map((edge) => [edge.id, edge]));

    /*
      the route an offer would be paid on. crossing an edge that lands back on
      a node the route has already reached is only worth doing when the lap it
      closes costs less than nothing, so an offer that merely doubles back is
      answered with no route and reads as a bare cost
    */
    const routeBehindOffer = (edge: GEdge, offered: Fraction) => {
      const basePath = routeTo(edge.source);

      let reached = new Fraction(0);
      let at = sourceNodeId;

      for (const id of basePath) {
        if (at === edge.target && offered.gte(reached)) return [];
        const crossed = edgeById.get(id);
        if (!crossed) return [];
        reached = reached.add(crossed.weight);
        at = crossed.target;
      }

      return [...basePath, edge.id];
    };

    const totalPasses = Math.max(nodeIds.length - 1, 0);

    let sweep: SingleSourceSweep['sweep'];

    const beginSweep = (pass?: number) => {
      sweep = {
        edgeIds: sweepEdgeIds,
        position: 0,
        pass,
        totalPasses,
        outcomes: {},
      };
    };

    const advanceSweepTo = (index: number) => {
      if (sweep) sweep.position = index + 1;
    };

    const recordSweepOutcome = (edge: GEdge, outcome: SweepOutcome) => {
      if (sweep) sweep.outcomes[edge.id] = outcome;
    };

    const endSweep = () => {
      sweep = undefined;
    };

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

    /**
     * what crossing this edge would offer the node it lands on, next to what
     * that node already holds. absent when nothing has reached the far side to
     * cross from, which every caller answers with {@link skipUnreachable}
     */
    const offerAcross = (edge: GEdge) => {
      const reachedFrom = distances[edge.source];
      if (reachedFrom === undefined) return;

      return {
        reachedFrom,
        offered: reachedFrom.add(edge.weight),
        current: distances[edge.target],
      };
    };

    const skipUnreachable = (edge: GEdge) => {
      recordSweepOutcome(edge, 'skipped');
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

    /**
     * one more sweep once the passes are spent. every distance that can be
     * final is by then, so an edge that still improves one is riding a loop
     * that gets cheaper every lap. reports the cycle and answers whether it
     * found one, since nothing after it is worth showing if it did
     */
    const runNegativeCycleSweep = () => {
      beginSweep();
      frameCollector.add(
        frame({
          type: 'begin-verification',
          passesDone: totalPasses,
          nodeCount: nodeIds.length,
        }),
      );

      for (const [index, edge] of allEdges.entries()) {
        advanceSweepTo(index);

        const offer = offerAcross(edge);

        if (!offer) {
          skipUnreachable(edge);
          continue;
        }

        const { offered, current } = offer;

        if (current === undefined || offered.lt(current)) {
          recordSweepOutcome(edge, 'improved');
          arrivalEdgeByNode.set(edge.target, edge);
          endSweep();
          reportTheCycle(edge);
          return true;
        }

        recordSweepOutcome(edge, 'kept');
        frameCollector.add(
          frame({
            type: 'verify-edge',
            edge: edge.id,
            from: edge.source,
            to: edge.target,
            offered,
            current,
            currentPath: routeTo(edge.target),
            activeNodeId: edge.source,
            candidateNodeIds: [edge.target],
            relaxingEdgeIds: [edge.id],
          }),
        );
      }

      endSweep();
      frameCollector.add(frame({ type: 'no-negative-cycle' }));
      return false;
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

      let anyDistanceImproved = false;

      for (const [index, edge] of allEdges.entries()) {
        advanceSweepTo(index);

        const offer = offerAcross(edge);

        if (!offer) {
          skipUnreachable(edge);
          continue;
        }

        const { reachedFrom, offered, current } = offer;

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
          recordSweepOutcome(edge, 'kept');
          frameCollector.add(
            frame({
              type: 'keep-distance',
              node: edge.target,
              distance: current,
              offered,
              edge: edge.id,
              offeredPath: routeBehindOffer(edge, offered),
              currentPath: routeTo(edge.target),
              activeNodeId: edge.source,
              candidateNodeIds: [edge.target],
              rejectedEdgeIds: [edge.id],
            }),
          );
          continue;
        }

        // read before they are replaced, or the route being beaten is already
        // gone, and the route the new cost is built on already rewritten
        const oldPath = routeTo(edge.target);
        const basePath = routeTo(edge.source);

        distances[edge.target] = offered;
        arrivalEdgeByNode.set(edge.target, edge);
        routeByNode.set(edge.target, [...basePath, edge.id]);

        recordSweepOutcome(edge, 'improved');
        anyDistanceImproved = true;

        frameCollector.add(
          frame({
            type: 'improve-distance',
            node: edge.target,
            oldDistance: current,
            newDistance: offered,
            via: edge.source,
            base: reachedFrom,
            edge: edge.id,
            newPath: [...basePath, edge.id],
            oldPath,
            activeNodeId: edge.source,
            candidateNodeIds: [edge.target],
            relaxingEdgeIds: [edge.id],
          }),
        );
      }

      if (anyDistanceImproved) continue;

      endSweep();
      frameCollector.add(frame({ type: 'pass-settled', pass }));
      provedByFixpoint = true;
      break;
    }

    const passesRanOut = !provedByFixpoint && totalPasses > 0;

    if (passesRanOut && runNegativeCycleSweep()) return;

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
