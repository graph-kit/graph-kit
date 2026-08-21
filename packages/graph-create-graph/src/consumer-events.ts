import { createEventHub } from '@core/events/createEventHub';
import { EventMapToEventRegistry } from '@core/events/types';
import { ConsumerEventMap, TransitEventMap } from '@graph/core/consumer-events';
import {
  NodePositionEntry,
  NodePositionStoreControls,
} from '@graph/core/positions/types';
import {
  EdgeWeightEntry,
  EdgeWeightStoreControls,
} from '@graph/core/weights/types';
import { GraphActions } from '@graph/primitives/actions/types';
import {
  ElementAdditionPayload,
  ElementRemovalPayload,
  TransactionPayload,
} from '@graph/primitives/transactions/types';
import { CoreEdge, CoreNode } from '@graph/primitives/types';
import { batch } from '@reactive/primitives/index';

export type { ConsumerEventMap };

const createConsumerEventRegistry =
  (): EventMapToEventRegistry<ConsumerEventMap> => ({
    onStructureChange: new Set(),
    onNodesAdded: new Set(),
    onNodesRemoved: new Set(),
    onEdgesAdded: new Set(),
    onEdgesRemoved: new Set(),
    onElementsAdded: new Set(),
    onElementsRemoved: new Set(),
    onEdgeWeightsChanged: new Set(),
    onNodePositionsCommitted: new Set(),
  });

export type ConsumerEventHub = ReturnType<typeof createConsumerEventHub>;

export const createConsumerEventHub = () =>
  createEventHub<ConsumerEventMap>(createConsumerEventRegistry());

// kept off ConsumerEventMap on purpose — see TransitEventMap in
// @graph/core/consumer-events. its own hub, exposed at events.transit.
export type TransitEventHub = ReturnType<typeof createTransitEventHub>;

export const createTransitEventHub = () =>
  createEventHub<TransitEventMap>({
    onEncoded: new Set(),
    onDecoded: new Set(),
  });

const hasItems = (...arrays: unknown[][]) =>
  arrays.some((arr) => arr.length > 0);

// onEdgeWeightsChanged and onNodePositionsCommitted are derived by wrapping their own
// store controls below, not from a TransactionPayload — neither goes through an action.
type NonStructureChangeEvent = Exclude<
  keyof ConsumerEventMap,
  'onStructureChange' | 'onEdgeWeightsChanged' | 'onNodePositionsCommitted'
>;

const eventNameToPredicateMap: {
  [EventName in NonStructureChangeEvent]: (
    payload: TransactionPayload,
  ) => { args: Parameters<ConsumerEventMap[EventName]> } | void;
} = {
  onNodesAdded: ({ addedNodes }) => {
    if (addedNodes.length > 0) return { args: [addedNodes] };
  },
  onNodesRemoved: ({ removedNodeIds, removedEdgeIds }) => {
    if (removedNodeIds.length > 0)
      return { args: [removedNodeIds, removedEdgeIds] };
  },
  onEdgesAdded: ({ addedEdges }) => {
    if (addedEdges.length > 0) return { args: [addedEdges] };
  },
  onEdgesRemoved: ({ removedEdgeIds }) => {
    if (removedEdgeIds.length > 0) return { args: [removedEdgeIds] };
  },
  onElementsAdded: ({ addedEdges, addedNodes }) => {
    if (hasItems(addedNodes, addedEdges)) {
      return { args: [{ addedEdges, addedNodes }] };
    }
  },
  onElementsRemoved: ({ removedEdgeIds, removedNodeIds }) => {
    if (hasItems(removedNodeIds, removedEdgeIds)) {
      return { args: [{ removedEdgeIds, removedNodeIds }] };
    }
  },
};

export const emitConsumerEvents = (
  payload: TransactionPayload,
  emit: ConsumerEventHub['emit'],
) => {
  const hasStructuralChanges = hasItems(
    payload.addedNodes,
    payload.addedEdges,
    payload.removedNodeIds,
    payload.removedEdgeIds,
  );
  if (hasStructuralChanges) emit('onStructureChange');

  for (const eventName of Object.keys(
    eventNameToPredicateMap,
  ) as NonStructureChangeEvent[]) {
    const result = eventNameToPredicateMap[eventName](payload);
    if (result) emit(eventName, ...result.args);
  }
};

// each action's return value is shaped differently, so it needs its own
// mapping into the common TransactionPayload shape the predicates expect
const actionResultToPartialPayload = {
  addNode: (node: CoreNode): Partial<TransactionPayload> => ({
    addedNodes: [node],
  }),
  removeNode: (result: ElementRemovalPayload): Partial<TransactionPayload> =>
    result,
  addEdge: (edge: CoreEdge): Partial<TransactionPayload> => ({
    addedEdges: [edge],
  }),
  removeEdge: (edgeId: CoreEdge['id']): Partial<TransactionPayload> => ({
    removedEdgeIds: [edgeId],
  }),
  addElements: (result: ElementAdditionPayload): Partial<TransactionPayload> =>
    result,
  removeElements: (
    result: ElementRemovalPayload,
  ): Partial<TransactionPayload> => result,
};

// see [2] in graph-plugins-shared/plugins/internals/plugin.ts — a stable stand-in
// for "the fully-composed graph actions," safe to hand to plugins during fold and
// capture in a closure for later invocation, even though the real thing doesn't
// exist until folding (and the consumer-event wrap above) finishes. every call
// dispatches through `resolve`'s argument, whatever it ends up being.
export const createFinalActionsProxy = <
  Actions extends GraphActions<any>,
>() => {
  let resolved: Actions | undefined;

  const dispatch =
    (key: keyof typeof actionResultToPartialPayload) =>
    (...args: any[]) => {
      if (!resolved) {
        throw new Error(
          `finalActions.${key} was called before graph creation finished`,
        );
      }
      return (resolved[key] as any)(...args);
    };

  const proxy = {
    addNode: dispatch('addNode'),
    removeNode: dispatch('removeNode'),
    addEdge: dispatch('addEdge'),
    removeEdge: dispatch('removeEdge'),
    addElements: dispatch('addElements'),
    removeElements: dispatch('removeElements'),
  } as Actions;

  return {
    finalActions: proxy,
    resolveFinalActions: (actions: Actions) => {
      resolved = actions;
    },
  };
};

export const wrapActionsWithConsumerEvents = <
  Actions extends GraphActions<any>,
>(
  actions: Actions,
  hub: ConsumerEventHub,
): Actions => {
  const wrapped = { ...actions };

  for (const key of Object.keys(actionResultToPartialPayload) as Array<
    keyof typeof actionResultToPartialPayload
  >) {
    const action = actions[key];
    if (!action) continue;

    // `action` is the fully composed stack here, so batching catches plugin state
    // written after the delegated core action, which core's own `atomic` cannot reach.
    (wrapped as any)[key] = (...args: any[]) => {
      const result = batch(() => (action as any)(...args));
      const partialPayload = (actionResultToPartialPayload[key] as any)(result);
      emitConsumerEvents(
        {
          addedNodes: [],
          addedEdges: [],
          removedNodeIds: [],
          removedEdgeIds: [],
          ...partialPayload,
        },
        hub.emit,
      );
      return result;
    };
  }

  return wrapped;
};

// weight changes don't go through an action (no addNode/removeNode-style call for
// setting a weight), so they can't be picked up by wrapActionsWithConsumerEvents.
// create-graph gets the same derivation authority here by wrapping the weight
// controls themselves — never by subscribing to core's own event hub.
export const wrapWeightsControlsWithConsumerEvents = (
  weights: EdgeWeightStoreControls,
  hub: ConsumerEventHub,
): EdgeWeightStoreControls => {
  const emitChange = (entries: EdgeWeightEntry[]) => {
    hub.emit('onEdgeWeightsChanged', entries);
    hub.emit('onStructureChange');
  };

  return {
    ...weights,
    set: (update) => {
      const entry = weights.set(update);
      emitChange([entry]);
      return entry;
    },
    setMany: (updates) => {
      const entries = weights.setMany(updates);
      emitChange(entries);
      return entries;
    },
  };
};

// same reasoning as weights: position writes don't go through an action, so create-graph
// wraps the store to keep derivation authority. the stream is wrapped too, since a drag
// commits through stop() rather than through set/setMany, and a consumer wanting "the
// node settled here" must not have to know which path produced it.
export const wrapPositionsControlsWithConsumerEvents = (
  positions: NodePositionStoreControls,
  hub: ConsumerEventHub,
): NodePositionStoreControls => {
  const emitCommitted = (entries: NodePositionEntry[]) => {
    // an already stopped stream and an empty setMany both commit nothing, and a
    // subscriber encoding this for the wire would broadcast a no-op
    if (entries.length === 0) return;
    // deliberately no onStructureChange: the node and edge sets are unchanged, and
    // implying otherwise would rerun every structure listener on each drag
    hub.emit('onNodePositionsCommitted', entries);
  };

  return {
    ...positions,
    set: (update) => {
      const entry = positions.set(update);
      emitCommitted([entry]);
      return entry;
    },
    setMany: (updates) => {
      const entries = positions.setMany(updates);
      emitCommitted(entries);
      return entries;
    },
    createStream: () => {
      const stream = positions.createStream();
      return {
        ...stream,
        stop: () => {
          const committed = stream.stop();
          emitCommitted(committed);
          return committed;
        },
      };
    },
  };
};
