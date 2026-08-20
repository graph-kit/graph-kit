import { EventHub } from '@core/events/createEventHub';
import { CoreEdge, CoreNode } from '@graph/primitives/types';
import { Signal } from '@reactive/primitives/index';

import { CoreEventMap } from '../events.ts';
import { NodePositionStoreControls } from '../positions/types.ts';
import { EdgeWeightStoreControls } from '../weights/types.ts';
import { TransactionOptions } from './types.ts';

type TransactionSucceededOptions = Pick<EventHub<CoreEventMap>, 'emit'> & {
  nodes: Signal<CoreNode[]>;
  edges: Signal<CoreEdge[]>;
  positions: NodePositionStoreControls;
  weights: EdgeWeightStoreControls;
};

export const setupTransactionSucceeded = ({
  nodes,
  edges,
  positions,
  weights,
  emit,
}: TransactionSucceededOptions): TransactionOptions['onTransactionSucceeded'] => {
  return (payload) => {
    // in before the signal write, since derivations recompute synchronously off the new
    // arrays and resolve a position and a weight for every element they find there. the
    // transaction owns this rather than the actions so that only accepted elements ever
    // reach a store, leaving nothing to roll back when one is rejected
    positions._internal.add(payload.addedNodes);
    weights._internal.add(payload.addedEdges);

    // arrays are replaced rather than spliced in place. a signal only notifies when
    // its setter runs, so an in place splice would leave every derivation stale
    let nextNodes = nodes();
    let nextEdges = edges();

    // guarded separately: filter always returns a new array, so filtering both under
    // one combined check would make an edge only removal notify every node dependent
    if (payload.removedNodeIds.length) {
      const removedNodeIds = new Set(payload.removedNodeIds);
      nextNodes = nextNodes.filter((n) => !removedNodeIds.has(n.id));
    }

    if (payload.removedEdgeIds.length) {
      const removedEdgeIds = new Set(payload.removedEdgeIds);
      nextEdges = nextEdges.filter((e) => !removedEdgeIds.has(e.id));
    }

    // map to remove excess properties that may have snuck in due to TS structural typing
    if (payload.addedNodes.length) {
      nextNodes = [
        ...nextNodes,
        ...payload.addedNodes.map((n): CoreNode => ({ id: n.id })),
      ];
    }

    if (payload.addedEdges.length) {
      nextEdges = [
        ...nextEdges,
        ...payload.addedEdges.map((e): CoreEdge => ({
          id: e.id,
          source: e.source,
          target: e.target,
        })),
      ];
    }

    // a fresh array is never Object.is equal to the old one, so writing
    // unconditionally would notify every dependent on a transaction that changed nothing
    if (nextNodes !== nodes()) nodes(nextNodes);
    if (nextEdges !== edges()) edges(nextEdges);

    emit('onTransactionComplete', payload);

    // and out only after the emit, which is where the actions were removing them from
    // before: a subscriber still gets to resolve what the removal was about.
    //
    // an id the same transaction re-added keeps its entry, or replacing an element by
    // removing and adding it under one commit would strip the entry just written for it
    const readdedNodeIds = new Set(payload.addedNodes.map((n) => n.id));
    const readdedEdgeIds = new Set(payload.addedEdges.map((e) => e.id));

    positions._internal.remove(
      payload.removedNodeIds.filter((id) => !readdedNodeIds.has(id)),
    );
    weights._internal.remove(
      payload.removedEdgeIds.filter((id) => !readdedEdgeIds.has(id)),
    );
  };
};
