import { nullThrows } from '@core/utils/assert';
import { GEdge, GNode } from '@magic/shared/graph';
import { FrameCollectorFn } from '@magic/shared/simulation/types';

import { KahnsFrame, KahnsStep } from './frame.ts';

type KahnsEdge = Pick<GEdge, 'id' | 'source' | 'target'>;

export const kahns =
  (
    nodeIds: readonly GNode['id'][],
    edges: readonly KahnsEdge[],
  ): FrameCollectorFn<KahnsFrame> =>
  (frameCollector) => {
    const inDegrees = new Map<GNode['id'], number>();
    const outgoing = new Map<GNode['id'], KahnsEdge[]>();
    for (const id of nodeIds) {
      inDegrees.set(id, 0);
      outgoing.set(id, []);
    }

    const inDegreeOf = (id: GNode['id']) =>
      nullThrows(inDegrees.get(id), 'edge target is not a node');

    for (const edge of edges) {
      nullThrows(outgoing.get(edge.source), 'edge source is not a node').push(
        edge,
      );
      inDegrees.set(edge.target, inDegreeOf(edge.target) + 1);
    }

    const queue: GNode['id'][] = [];
    const ordered: GNode['id'][] = [];
    const removedEdgeIds: GEdge['id'][] = [];
    let placedNodeId: GNode['id'] | undefined;

    const frame = (step: KahnsStep): KahnsFrame => ({
      ...step,
      inDegrees: Object.fromEntries(inDegrees),
      orderedNodeIds: [...ordered],
      placedNodeId,
      queuedNodeIds: [...queue],
      removedEdgeIds: [...removedEdgeIds],
    });

    frameCollector.add(frame({ type: 'count-in-degrees' }));

    queue.push(...nodeIds.filter((id) => inDegreeOf(id) === 0));
    if (queue.length > 0) {
      frameCollector.add(frame({ type: 'enqueue-sources' }));
    }

    for (;;) {
      const node = queue.shift();
      if (node === undefined) break;

      ordered.push(node);
      placedNodeId = node;
      frameCollector.add(frame({ type: 'place-node', node }));

      for (const edge of nullThrows(outgoing.get(node), 'node not indexed')) {
        const inDegree = inDegreeOf(edge.target) - 1;
        inDegrees.set(edge.target, inDegree);
        removedEdgeIds.push(edge.id);

        if (inDegree > 0) {
          frameCollector.add(
            frame({ type: 'remove-edge', edge: edge.id, node: edge.target }),
          );
          continue;
        }

        queue.push(edge.target);
        frameCollector.add(
          frame({ type: 'enqueue-node', edge: edge.id, node: edge.target }),
        );
      }
    }

    placedNodeId = undefined;
    frameCollector.add(
      frame({
        type: 'end',
        stuckNodeIds: nodeIds.filter((id) => inDegreeOf(id) > 0),
      }),
    );
  };
