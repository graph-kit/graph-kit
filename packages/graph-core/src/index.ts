import { createEventHub } from '@core/events/createEventHub';
import { nullThrows } from '@core/utils/assert';
import type { CoreEdge, CoreNode } from '@graph/primitives/types';
import { batch, signal } from '@reactive/primitives/index';
import Fraction from 'fraction.js';

import { createCoreActions } from './actions/createCoreActions.ts';
import { createCoreEventRegistry } from './events.ts';
import { createHelpers } from './helpers/createHelpers.ts';
import { CoreOptions, DEFAULT_CORE_OPTIONS } from './options.ts';
import { createNodePositionStore } from './positions/createNodePositionStore.ts';
import { createCommitTransaction } from './transaction/createCommitTransaction.ts';
import { setupTransactionSucceeded } from './transaction/setupTransactionSucceeded.ts';
import { createInspectDraft } from './transaction/validateDraft.ts';
import type { CoreControls, CoreTransitControls } from './types.ts';
import { createEdgeWeightStore } from './weights/createEdgeWeightStore.ts';

export const core = (options: Partial<CoreOptions>) => {
  const metadata = {
    ...DEFAULT_CORE_OPTIONS,
    ...options,
  };

  const eventRegistry = createCoreEventRegistry();
  const coreEventHub = createEventHub(eventRegistry);

  const nodes = signal<CoreNode[]>([]);
  const edges = signal<CoreEdge[]>([]);

  const readNodes = () => nodes();
  const readEdges = () => edges();

  const nodePositionStore = createNodePositionStore(coreEventHub);
  const edgeWeightStore = createEdgeWeightStore(coreEventHub, metadata);

  const getNode = (id: CoreNode['id']) =>
    nullThrows(
      readNodes().find((n) => n.id === id),
      `node with id ${id} not found`,
    );
  const getEdge = (id: CoreEdge['id']) => {
    const edge = nullThrows(
      readEdges().find((e) => e.id === id),
      `edge with id ${id} not found`,
    );
    return { ...edge, weight: edgeWeightStore.get(id) };
  };

  const coreGetters = {
    getNode,
    getEdge,
  };

  const onTransactionSucceeded = setupTransactionSucceeded({
    edges,
    nodes,
    positions: nodePositionStore,
    weights: edgeWeightStore,
    emit: coreEventHub.emit,
  });

  // one set of rules, asked either way: the transaction enforces them, consumers ask
  // ahead of an edit so a refusal lands where the user made it
  const inspectDraft = createInspectDraft(
    { nodes: readNodes, edges: readEdges },
    metadata.directed,
  );

  const commitTransaction = createCommitTransaction({
    graph: { nodes: readNodes, edges: readEdges },
    inspectDraft,
    onTransactionSucceeded,
  });

  const coreActions = createCoreActions({
    commitTransaction,
    graph: {
      nodes: readNodes,
      edges: readEdges,
    },
  });

  const coreControls: CoreControls = {
    nodes: readNodes,
    edges: readEdges,
    isNode: (id: string) => readNodes().some((n) => n.id === id),
    isEdge: (id: string) => readEdges().some((e) => e.id === id),
    inspect: {
      draft: inspectDraft,
      canAddEdge: (edge) => inspectDraft({ addEdges: [edge] }).valid,
      canAddNode: (node) => inspectDraft({ addNodes: [node] }).valid,
    },
    nodeIdToIndex: (id: string) => readNodes().findIndex((n) => n.id === id),
    edgeIdToIndex: (id: string) => readEdges().findIndex((n) => n.id === id),
    helpers: createHelpers({
      edges: readEdges,
      getEdge,
      getNode,
      metadata,
    }),
    metadata,
    positions: nodePositionStore,
    weights: edgeWeightStore,
  };

  const coreTransit: CoreTransitControls = {
    encode: () => {
      const edgeWeights = Array.from(
        edgeWeightStore._internal.edgeIdToEdgeWeight,
      ).map(([id, weight]) => ({ id, weight: weight.toString() }));

      const nodePositions = Array.from(
        nodePositionStore._internal.nodeIdToNodePosition,
      ).map(([id, position]) => ({ id, position }));

      return {
        nodes: [...nodes()],
        edges: [...edges()],
        edgeWeights,
        nodePositions,
      };
    },
    // batched for the same reason actions are (see `atomic` in createCoreActions):
    // decode tears down and rebuilds across four writes, and the state in between is
    // not a graph anyone should be able to observe
    decode: (data) =>
      batch(() => {
        // --- CLEANUP EXISTING STATE ---
        // removing every node scrapes every edge with it, and the transaction empties both
        // stores of whatever it removed
        commitTransaction({
          removeNodeIds: nodes().map((n) => n.id),
        });

        // --- APPLY NEW STATE ---
        const nodeIdToPosition = new Map(
          data.nodePositions.map(({ id, position }) => [id, position]),
        );
        const edgeIdToWeight = new Map(
          data.edgeWeights.map(({ id, weight }) => [id, weight]),
        );

        // positions and weights ride along on the elements, since filling the stores is
        // the transaction's to do once it has accepted them
        commitTransaction({
          addNodes: data.nodes.map((node) => ({
            ...node,
            position: nodeIdToPosition.get(node.id),
          })),
          addEdges: data.edges.map((edge) => {
            const weight = edgeIdToWeight.get(edge.id);
            return {
              ...edge,
              weight: weight === undefined ? undefined : new Fraction(weight),
            };
          }),
        });
      }),
    validate: (data) => true,
  };

  return {
    controls: coreControls,
    actions: coreActions,
    getters: coreGetters,
    events: coreEventHub,
    transit: coreTransit,
  };
};
