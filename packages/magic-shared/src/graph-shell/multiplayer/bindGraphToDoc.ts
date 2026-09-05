import { Coordinate } from '@canvas/surface/types';
import { Annotation, AnnotationsChange } from '@core/annotations/index';
import { NodePositionStreamControls } from '@graph/core/positions/types';
import { ConsumerEventMap } from '@graph/create-graph/consumer-events';
import { UserId } from '@multiplayer/protocol/room';
import Fraction from 'fraction.js';
import * as Y from 'yjs';

import { computed, ref } from 'vue';

import { Graph } from '../../graph/types.ts';
import { DocBindMode, DocBinding, HistoryField } from '../../product/types.ts';

/** named rather than inline so unbind can hand back the very same reference */
type GraphSubscriber<Name extends keyof ConsumerEventMap> =
  ConsumerEventMap[Name];

/**
 * The room's view of a node. Deliberately not the graph's: z is paint order driven by
 * whoever hovered last, so syncing it would put a message on the wire per hover and
 * reorder everyone else's canvas for it.
 */
type DocNode = {
  x: number;
  y: number;
  label: string;
};

type DocEdge = {
  source: string;
  target: string;
  /** a string because a Fraction is not structured cloneable */
  weight: string;
};

/**
 * The room's view of an annotation, keyed by its id. Everything an annotation is except
 * the id and the type, which is always a draw: an erased stroke leaves the map rather
 * than staying in it as an erasure.
 */
type DocAnnotation = {
  points: Coordinate[];
  fillColor?: string;
  brushWeight?: number;
};

/**
 * Marks writes this binding makes into the document, so this binding skips them when
 * they come back around as a transaction.
 * Distinct from the connection's remote origin, which decides what goes on the wire.
 */
const BINDING_ORIGIN = Symbol('graph-shell/binding');

/**
 * The same, for a write that tidies the document rather than carrying an edit of this
 * user's. Kept apart so undo, which tracks BINDING_ORIGIN, cannot reverse it: a client
 * clearing up after somebody else's removal has nothing to put back.
 */
const RECONCILE_ORIGIN = Symbol('graph-shell/reconcile');

/**
 * The keys one transaction touched. The reconcile is scoped to these rather than run
 * over the whole document, so a change to one element cannot reach any other: a node
 * someone is dragging right now is ahead of the document by design, and a full diff
 * reads that as a move to undo.
 */
type DocChanges = {
  nodeIds: Set<string>;
  edgeIds: Set<string>;
  annotationIds: Set<string>;
};

const readNodes = (doc: Y.Doc) => doc.getMap<DocNode>('nodes');
const readEdges = (doc: Y.Doc) => doc.getMap<DocEdge>('edges');
const readAnnotations = (doc: Y.Doc) =>
  doc.getMap<DocAnnotation>('annotations');

/** yjs keys its changed map by a supertype no concrete Y.Map is assignable to */
type ChangedType = Parameters<Y.Transaction['changed']['get']>[0];

/** yjs records a null key for a change to the type itself, which a map never has */
const changedKeys = <T>(
  transaction: Y.Transaction,
  map: Y.Map<T>,
): Set<string> => {
  const changed = transaction.changed.get(map as unknown as ChangedType);
  if (!changed) return new Set();
  return new Set(
    [...changed].filter((key): key is string => typeof key === 'string'),
  );
};

/** the changed keys still in the map, paired with what they now hold */
const presentEntries = <T>(map: Y.Map<T>, ids: Set<string>): [string, T][] => {
  const entries: [string, T][] = [];
  for (const id of ids) {
    const value = map.get(id);
    if (value !== undefined) entries.push([id, value]);
  }
  return entries;
};

const annotationToDoc = ({
  points,
  fillColor,
  brushWeight,
}: Annotation): DocAnnotation => ({ points, fillColor, brushWeight });

const annotationFromDoc = (
  id: string,
  annotation: DocAnnotation,
): Annotation => ({ id, type: 'draw', ...annotation });

const nodeFromGraph = (graph: Graph, nodeId: string): DocNode => {
  const { x, y } = graph.positions.get(nodeId);
  return { x, y, label: graph.getNode(nodeId).label };
};

/** getEdge throws on an id the graph no longer holds rather than answering undefined */
const edgeFromGraph = (graph: Graph, edgeId: string): DocEdge | undefined => {
  if (!graph.isEdge(edgeId)) return undefined;
  const edge = graph.getEdge(edgeId);
  return {
    source: edge.source,
    target: edge.target,
    weight: edge.weight.toString(),
  };
};

/**
 * Undo over the shared types rather than over whole graph snapshots, which is what makes
 * it safe with other people writing: it reverses the items this client wrote and merges
 * with everything else, where restoring a snapshot would rewrite a peer's work too.
 */
const createDocHistory = (doc: Y.Doc): HistoryField => {
  const undoManager = new Y.UndoManager(
    [readNodes(doc), readEdges(doc), readAnnotations(doc)],
    {
      // BINDING_ORIGIN is the only origin a local edit carries, so tracking it and
      // nothing else is what scopes undo to this client
      trackedOrigins: new Set([BINDING_ORIGIN]),
    },
  );

  const refresh = ref(0);
  const bump = () => refresh.value++;
  undoManager.on('stack-item-added', bump);
  undoManager.on('stack-item-popped', bump);
  undoManager.on('stack-cleared', bump);

  const history: HistoryField = {
    canUndo: computed(() => {
      refresh.value;
      return undoManager.undoStack.length > 0;
    }),
    canRedo: computed(() => {
      refresh.value;
      return undoManager.redoStack.length > 0;
    }),
    undo: () => undoManager.undo(),
    redo: () => undoManager.redo(),
    clear: () => undoManager.clear(),
  };

  // the doc outlives no product, so the manager goes with it
  doc.on('destroy', () => undoManager.destroy());

  return history;
};

/**
 * Ties a graph to a room document, in both directions, for the life of the product.
 *
 * Seeding writes the graph into the document. Adopting rebuilds the graph from it, which
 * empties the graph when the room has nothing for this product, see {@link DocBindMode}.
 *
 * Hands back undo over the document, which the shell uses in place of the graph's own
 * whole state history for as long as the graph is shared.
 */
export const bindGraphToDoc = (
  graph: Graph,
  doc: Y.Doc,
  mode: DocBindMode,
  isDraggedLocally: (nodeId: string) => boolean,
): DocBinding => {
  const nodes = readNodes(doc);
  const edges = readEdges(doc);
  const annotations = readAnnotations(doc);

  // graph events emit synchronously inside the mutation's own stack frame, so a handler
  // always observes the flag the apply that triggered it set
  let applyingFromDoc = false;

  const intoDoc = (write: () => void, origin: symbol = BINDING_ORIGIN) => {
    if (applyingFromDoc) return;
    doc.transact(write, origin);
  };

  const intoGraph = (apply: () => void) => {
    applyingFromDoc = true;
    try {
      apply();
    } finally {
      applyingFromDoc = false;
    }
  };

  /** reconciles the document to match the graph exactly, additions and removals alike */
  const writeWholeGraph = () => {
    intoDoc(() => {
      const liveNodeIds = new Set(graph.nodes.value.map((node) => node.id));
      const liveEdgeIds = new Set(graph.edges.value.map((edge) => edge.id));

      for (const nodeId of [...nodes.keys()]) {
        if (!liveNodeIds.has(nodeId)) nodes.delete(nodeId);
      }
      for (const edgeId of [...edges.keys()]) {
        if (!liveEdgeIds.has(edgeId)) edges.delete(edgeId);
      }

      for (const nodeId of liveNodeIds) {
        nodes.set(nodeId, nodeFromGraph(graph, nodeId));
      }
      for (const edgeId of liveEdgeIds) {
        const edge = edgeFromGraph(graph, edgeId);
        if (edge) edges.set(edgeId, edge);
      }

      const liveAnnotations = graph.annotations.annotations();
      const liveAnnotationIds = new Set(liveAnnotations.map(({ id }) => id));

      for (const annotationId of [...annotations.keys()]) {
        if (!liveAnnotationIds.has(annotationId)) {
          annotations.delete(annotationId);
        }
      }
      for (const annotation of liveAnnotations) {
        annotations.set(annotation.id, annotationToDoc(annotation));
      }
    });
  };

  /** rebuilds the graph from the document, discarding whatever was on screen */
  const readWholeDoc = () => {
    intoGraph(() => {
      graph.actions.removeElements({
        nodes: graph.nodes.value.map((node) => ({ id: node.id })),
        edges: graph.edges.value.map((edge) => ({ id: edge.id })),
      });

      graph.actions.addElements({
        nodes: [...nodes.entries()].map(([id, node]) => ({
          id,
          label: node.label,
          position: { x: node.x, y: node.y },
        })),
        edges: [...edges.entries()].map(([id, edge]) => ({
          id,
          source: edge.source,
          target: edge.target,
          weight: new Fraction(edge.weight),
        })),
      });

      graph.annotations.setAll(
        [...annotations.entries()].map(([id, annotation]) =>
          annotationFromDoc(id, annotation),
        ),
      );
    });
  };

  // one action on this side for one change on the other, so the receiver derives the
  // same consequences the author's own action did
  const applyDocChange = ({ nodeIds, edgeIds, annotationIds }: DocChanges) => {
    /** edges the graph took with a removed node that the document is still holding */
    let orphanedEdgeIds: string[] = [];

    intoGraph(() => {
      const removedNodeIds = [...nodeIds].filter(
        (id) => !nodes.has(id) && graph.isNode(id),
      );
      const removedEdgeIds = [...edgeIds].filter(
        (id) => !edges.has(id) && graph.isEdge(id),
      );
      // removals first, since an action that replaced an element shows up as both
      if (removedNodeIds.length > 0 || removedEdgeIds.length > 0) {
        const removed = graph.actions.removeElements({
          nodes: removedNodeIds.map((id) => ({ id })),
          edges: removedEdgeIds.map((id) => ({ id })),
        });
        orphanedEdgeIds = removed.removedEdgeIds.filter((id) => edges.has(id));
      }

      const changedNodes = presentEntries(nodes, nodeIds);
      const changedEdges = presentEntries(edges, edgeIds);

      const addedNodes = changedNodes
        .filter(([id]) => !graph.isNode(id))
        .map(([id, node]) => ({
          id,
          label: node.label,
          position: { x: node.x, y: node.y },
        }));
      // after the nodes, since removing one cascades to the edges that name it
      const addedEdges = changedEdges
        .filter(([id]) => !graph.isEdge(id))
        .map(([id, edge]) => ({
          id,
          source: edge.source,
          target: edge.target,
          weight: new Fraction(edge.weight),
        }));
      if (addedNodes.length > 0 || addedEdges.length > 0) {
        graph.actions.addElements({ nodes: addedNodes, edges: addedEdges });
      }

      const moved = changedNodes
        // a node someone still has hold of is ahead of the document on purpose, and the
        // gesture's own commit is what will settle it
        .filter(([id]) => graph.isNode(id) && !isHeld(id))
        .filter(([id, node]) => {
          const position = graph.positions.get(id);
          return position.x !== node.x || position.y !== node.y;
        })
        .map(([id, node]) => ({
          nodeId: id,
          update: { x: node.x, y: node.y },
        }));
      if (moved.length > 0) graph.positions.setMany(moved);

      const relabeled = changedNodes
        .filter(
          ([id, node]) =>
            graph.isNode(id) && graph.getNode(id).label !== node.label,
        )
        .map(([id, node]) => ({ nodeId: id, label: node.label }));
      if (relabeled.length > 0) graph.nodeLabel.setMany(relabeled);

      const localAnnotationIds = new Set(
        graph.annotations.annotations().map(({ id }) => id),
      );
      // by id alone: a stroke is only ever drawn or erased, never edited
      const removedAnnotationIds = [...annotationIds].filter(
        (id) => !annotations.has(id) && localAnnotationIds.has(id),
      );
      if (removedAnnotationIds.length > 0) {
        graph.annotations.remove(removedAnnotationIds);
      }

      const addedAnnotations = presentEntries(annotations, annotationIds)
        .filter(([id]) => !localAnnotationIds.has(id))
        .map(([id, annotation]) => annotationFromDoc(id, annotation));
      if (addedAnnotations.length > 0) graph.annotations.add(addedAnnotations);

      const reweighted = changedEdges
        .filter(
          ([id, edge]) =>
            graph.isEdge(id) &&
            graph.getEdge(id).weight.toString() !== edge.weight,
        )
        .map(([id, edge]) => ({
          edgeId: id,
          update: new Fraction(edge.weight),
        }));
      if (reweighted.length > 0) graph.weights.setMany(reweighted);
    });

    // an edge drawn against a node someone else was removing at the same time is one
    // no graph can hold: every client drops it, so the document has to be told
    if (orphanedEdgeIds.length > 0) {
      intoDoc(() => {
        for (const edgeId of orphanedEdgeIds) edges.delete(edgeId);
      }, RECONCILE_ORIGIN);
    }
  };

  // one transaction is one change, where a per map observer would split it into as many
  // applies as it touched maps and leave the order yjs walked them deciding whether a
  // node exists by the time the edge naming it arrives
  //
  // the document is the source for everything except what this binding just wrote
  const onTransaction = (transaction: Y.Transaction) => {
    if (
      transaction.origin === BINDING_ORIGIN ||
      transaction.origin === RECONCILE_ORIGIN
    ) {
      return;
    }
    const changes: DocChanges = {
      nodeIds: changedKeys(transaction, nodes),
      edgeIds: changedKeys(transaction, edges),
      annotationIds: changedKeys(transaction, annotations),
    };
    const touched =
      changes.nodeIds.size + changes.edgeIds.size + changes.annotationIds.size;
    if (touched === 0) return;
    applyDocChange(changes);
  };

  const onElementsAdded: GraphSubscriber<'onElementsAdded'> = ({
    addedNodes,
    addedEdges,
  }) => {
    intoDoc(() => {
      for (const node of addedNodes) {
        nodes.set(node.id, nodeFromGraph(graph, node.id));
      }
      for (const added of addedEdges) {
        const edge = edgeFromGraph(graph, added.id);
        if (edge) edges.set(added.id, edge);
      }
    });
  };

  const onElementsRemoved: GraphSubscriber<'onElementsRemoved'> = ({
    removedNodeIds,
    removedEdgeIds,
  }) => {
    intoDoc(() => {
      // edges first so the room never holds an edge whose endpoint is already gone
      for (const edgeId of removedEdgeIds) edges.delete(edgeId);
      for (const nodeId of removedNodeIds) nodes.delete(nodeId);
    });
  };

  // the settled move rather than onNodeMoveStream, which would send one message per frame
  const onNodePositionsCommitted: GraphSubscriber<
    'onNodePositionsCommitted'
  > = (positions) => {
    intoDoc(() => {
      for (const { nodeId } of positions) {
        if (!nodes.has(nodeId)) continue;
        nodes.set(nodeId, nodeFromGraph(graph, nodeId));
      }
    });
  };

  const onEdgeWeightsChanged: GraphSubscriber<'onEdgeWeightsChanged'> = (
    weights,
  ) => {
    intoDoc(() => {
      for (const { edgeId } of weights) {
        const edge = edgeFromGraph(graph, edgeId);
        if (edge) edges.set(edgeId, edge);
      }
    });
  };

  // the settled stroke rather than every point of it, the same boundary node drags use
  const onAnnotationsChanged = ({ added, removed }: AnnotationsChange) => {
    intoDoc(() => {
      for (const annotation of added) {
        annotations.set(annotation.id, annotationToDoc(annotation));
      }
      for (const annotation of removed) annotations.delete(annotation.id);
    });
  };

  // rawEvents rather than graph.events, whose subscribe registers an onUnmounted per
  // call: binding happens after the join resolves, so there is no component instance
  // left to attach to
  //
  // subscription driven rather than watcher driven: the suppression flag only holds
  // because graph events emit synchronously
  const subscribe = () => {
    doc.on('afterTransaction', onTransaction);
    graph.annotations.events.subscribe(
      'onAnnotationsChanged',
      onAnnotationsChanged,
    );
    graph.rawEvents.subscribe('onElementsAdded', onElementsAdded);
    graph.rawEvents.subscribe('onElementsRemoved', onElementsRemoved);
    graph.rawEvents.subscribe(
      'onNodePositionsCommitted',
      onNodePositionsCommitted,
    );
    graph.rawEvents.subscribe('onEdgeWeightsChanged', onEdgeWeightsChanged);
    // an undo or a link load replaces the whole graph at once, and there is no per
    // element event describing what changed
    graph.rawEvents.transit.subscribe('onDecoded', writeWholeGraph);
  };

  // one per peer, since two people dragging at once are two continuous moves and
  // neither belongs in the other's commit
  type PeerStream = {
    controls: NodePositionStreamControls;
    /** what this peer has hold of, so a document change can leave those nodes alone */
    nodeIds: Set<string>;
  };
  const peerStreams = new Map<UserId, PeerStream>();

  /**
   * Whether a gesture owns this node right now, whether it is this user's drag or a
   * peer's. A held node's live position runs ahead of the document until the gesture
   * commits, so reconciling it to what the document last saw is always wrong.
   */
  const isHeld = (nodeId: string) =>
    isDraggedLocally(nodeId) ||
    [...peerStreams.values()].some((stream) => stream.nodeIds.has(nodeId));

  const stopPeerStream = (peerId: UserId) => {
    const stream = peerStreams.get(peerId);
    if (!stream) return;
    peerStreams.delete(peerId);
    // stopping commits what the stream touched, and the authoring peer is already
    // sending that same move through the document
    intoGraph(() => stream.controls.stop());
  };

  const applyPeerDrag: DocBinding['applyPeerDrag'] = (peerId, elements) => {
    const moves = elements
      // a node the local user has hold of stays where they are putting it, and one
      // that is not on this graph yet arrives with the move that adds it. isNode
      // rather than getNode, which throws on a node this client has already removed
      .filter(({ id }) => !isDraggedLocally(id) && graph.isNode(id))
      .map(({ id, position }) => ({ nodeId: id, update: position }));
    if (moves.length === 0) return;

    const stream = peerStreams.get(peerId) ?? {
      controls: graph.positions.createStream(),
      nodeIds: new Set<string>(),
    };
    peerStreams.set(peerId, stream);
    for (const { nodeId } of moves) stream.nodeIds.add(nodeId);
    stream.controls.setMany(moves);
  };

  const endPeerDrag: DocBinding['endPeerDrag'] = (peerId) =>
    stopPeerStream(peerId);

  const unbind = () => {
    for (const peerId of [...peerStreams.keys()]) stopPeerStream(peerId);
    doc.off('afterTransaction', onTransaction);
    graph.annotations.events.unsubscribe(
      'onAnnotationsChanged',
      onAnnotationsChanged,
    );
    graph.rawEvents.unsubscribe('onElementsAdded', onElementsAdded);
    graph.rawEvents.unsubscribe('onElementsRemoved', onElementsRemoved);
    graph.rawEvents.unsubscribe(
      'onNodePositionsCommitted',
      onNodePositionsCommitted,
    );
    graph.rawEvents.unsubscribe('onEdgeWeightsChanged', onEdgeWeightsChanged);
    graph.rawEvents.transit.unsubscribe('onDecoded', writeWholeGraph);
  };

  if (mode === 'seed') writeWholeGraph();
  else readWholeDoc();

  subscribe();

  return {
    // after the seed, so undoing on a freshly opened product cannot empty the document
    history: createDocHistory(doc),
    unbind,
    applyPeerDrag,
    endPeerDrag,
  };
};
