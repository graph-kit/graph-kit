import { createAnnotationsEventRegistry } from '@core/annotations/events';
import { Annotation } from '@core/annotations/index';
import { createEventHub } from '@core/events/createEventHub';
import { nullThrows } from '@core/utils/assert';
import { TransitEventMap } from '@graph/core/consumer-events';
import { CoreEventMap } from '@graph/core/events';
import { createNodePositionStore } from '@graph/core/positions/createNodePositionStore';
import { ConsumerEventMap } from '@graph/create-graph/consumer-events';
import Fraction from 'fraction.js';
import { describe, expect, it } from 'vitest';
import * as Y from 'yjs';

import { Graph } from '../graph/types.ts';
import { bindGraphToDoc } from './bindGraphToDoc.ts';

/** not BINDING_ORIGIN, so a receiving binding treats it as somebody else's write */
const REMOTE_ORIGIN = 'remote';

type FakeNode = { id: string; label: string };
type FakeEdge = {
  id: string;
  source: string;
  target: string;
  weight: Fraction;
};

/**
 * Enough of a graph for the binding, with the real position store underneath so a drag
 * accumulates deltas the way the node drag plugin does. Everything the binding never
 * touches is left off.
 */
const createFakeGraph = () => {
  const nodes: FakeNode[] = [];
  const edges: FakeEdge[] = [];
  let annotations: Annotation[] = [];

  const coreEvents = createEventHub<CoreEventMap>({
    onNodeMoveStreamStart: new Set(),
    onNodeMoveStream: new Set(),
    onNodeMoveStreamEnd: new Set(),
    onNodePositionsCommitted: new Set(),
  } as never);

  const positions = createNodePositionStore(coreEvents);

  const rawEvents = createEventHub<ConsumerEventMap>({
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
  const transit = createEventHub<TransitEventMap>({
    onEncoded: new Set(),
    onDecoded: new Set(),
  });
  const annotationEvents = createEventHub(createAnnotationsEventRegistry());

  // the store commits on its own clock, so the consumer event the binding listens to is
  // relayed from the core one rather than emitted at each call site
  coreEvents.subscribe('onNodePositionsCommitted', (committed) =>
    rawEvents.emit('onNodePositionsCommitted', committed),
  );

  const findNode = (id: string) => nodes.find((node) => node.id === id);
  const findEdge = (id: string) => edges.find((edge) => edge.id === id);

  // the real getters resolve through nullThrows, so an id nobody holds is a fault
  // rather than an undefined. isNode and isEdge are the questions that have an answer
  const getNode = (id: string) =>
    nullThrows(findNode(id), `node with id ${id} not found`);
  const getEdge = (id: string) =>
    nullThrows(findEdge(id), `edge with id ${id} not found`);

  const removeElements = ({
    nodes: removedNodes = [],
    edges: removedEdges = [],
  }: {
    nodes?: { id: string }[];
    edges?: { id: string }[];
  }) => {
    const removedNodeIds = removedNodes.map(({ id }) => id);
    // a node takes the edges naming it with it, the way the real actions do
    const removedEdgeIds = [
      ...new Set([
        ...removedEdges.map(({ id }) => id),
        ...edges
          .filter(
            (edge) =>
              removedNodeIds.includes(edge.source) ||
              removedNodeIds.includes(edge.target),
          )
          .map((edge) => edge.id),
      ]),
    ];

    for (const id of removedEdgeIds) {
      const index = edges.findIndex((edge) => edge.id === id);
      if (index >= 0) edges.splice(index, 1);
    }
    for (const id of removedNodeIds) {
      const index = nodes.findIndex((node) => node.id === id);
      if (index >= 0) nodes.splice(index, 1);
    }
    positions._internal.remove(removedNodeIds);
    rawEvents.emit('onElementsRemoved', { removedNodeIds, removedEdgeIds });
    return { removedNodeIds, removedEdgeIds };
  };

  const addElements = ({
    nodes: addedNodes = [],
    edges: addedEdges = [],
  }: {
    nodes?: { id: string; label: string; position: { x: number; y: number } }[];
    edges?: { id: string; source: string; target: string; weight: Fraction }[];
  }) => {
    for (const node of addedNodes) {
      nodes.push({ id: node.id, label: node.label });
      positions._internal.add([{ id: node.id, position: node.position }]);
    }
    // the real transaction drops an edge with nowhere to land rather than holding a
    // reference to a node that is gone
    const acceptedEdges = addedEdges.filter(
      ({ source, target }) => findNode(source) && findNode(target),
    );
    for (const edge of acceptedEdges) edges.push({ ...edge });
    rawEvents.emit('onElementsAdded', {
      addedNodes: addedNodes.map(({ id }) => ({ id })),
      addedEdges: acceptedEdges.map(({ id }) => ({ id })),
    } as never);
  };

  const graph = {
    nodes: { value: nodes },
    edges: { value: edges },
    getNode,
    getEdge,
    isNode: (id: string) => findNode(id) !== undefined,
    isEdge: (id: string) => findEdge(id) !== undefined,
    positions,
    actions: { addElements, removeElements },
    nodeLabel: {
      setMany: (updates: { nodeId: string; label: string }[]) => {
        for (const { nodeId, label } of updates) {
          const node = findNode(nodeId);
          if (node) node.label = label;
        }
      },
    },
    weights: {
      setMany: (updates: { edgeId: string; update: Fraction }[]) => {
        for (const { edgeId, update } of updates) {
          const edge = findEdge(edgeId);
          if (edge) edge.weight = update;
        }
        rawEvents.emit(
          'onEdgeWeightsChanged',
          updates.map(({ edgeId }) => ({ edgeId })) as never,
        );
      },
    },
    annotations: {
      events: annotationEvents,
      annotations: () => annotations,
      setAll: (next: Annotation[]) => (annotations = [...next]),
      add: (added: Annotation[]) => annotations.push(...added),
      remove: (ids: string[]) =>
        (annotations = annotations.filter(({ id }) => !ids.includes(id))),
    },
    rawEvents: { ...rawEvents, transit },
  } as unknown as Graph;

  return {
    graph,
    nodes,
    edges,
    annotationEvents,
    annotationsOf: () => annotations,
  };
};

const seedGraph = (graph: Graph) =>
  graph.actions.addElements({
    nodes: [
      { id: 'a', label: 'A', position: { x: 0, y: 0 } },
      { id: 'b', label: 'B', position: { x: 100, y: 100 } },
    ],
    edges: [],
  } as never);

/**
 * One client: a graph, its doc, and the drag state the binding consults. A client given
 * a room to join adopts that document first, so it reads rather than seeds, the way the
 * second person into a room does. Letting two clients seed the same keys independently
 * would leave every one of them a concurrent write resolved by client id.
 */
const createClient = (room?: Y.Doc) => {
  const { graph, nodes, edges, annotationEvents, annotationsOf } =
    createFakeGraph();
  seedGraph(graph);

  let locallyDragged = new Set<string>();
  const doc = new Y.Doc();
  if (room) Y.applyUpdate(doc, Y.encodeStateAsUpdate(room));
  const binding = bindGraphToDoc(graph, doc, (nodeId) =>
    locallyDragged.has(nodeId),
  );

  return {
    graph,
    doc,
    binding,
    nodes,
    edges,
    annotationEvents,
    annotationsOf,
    positionOf: (nodeId: string) => {
      const { x, y } = graph.positions.get(nodeId);
      return { x, y };
    },
    setLocallyDragged: (nodeIds: string[]) => {
      locallyDragged = new Set(nodeIds);
    },
  };
};

const sync = (from: Y.Doc, to: Y.Doc) =>
  Y.applyUpdate(
    to,
    Y.encodeStateAsUpdate(from, Y.encodeStateVector(to)),
    REMOTE_ORIGIN,
  );

/** the deltas a node drag applies, which is what makes a mid gesture clobber stick */
const dragBy = (
  graph: Graph,
  stream: ReturnType<Graph['positions']['createStream']>,
  nodeId: string,
  dx: number,
  dy: number,
) =>
  stream.setMany([
    {
      nodeId,
      update: (position) => ({ x: position.x + dx, y: position.y + dy }),
    },
  ]);

describe(bindGraphToDoc, () => {
  it('seeds an empty document from the graph', () => {
    const { doc } = createClient();

    expect([...doc.getMap('nodes').keys()].sort()).toEqual(['a', 'b']);
  });

  it('applies a remote move', () => {
    const author = createClient();
    const peer = createClient(author.doc);

    author.graph.positions.set({ nodeId: 'a', update: { x: 50, y: 60 } });
    sync(author.doc, peer.doc);

    expect(peer.positionOf('a')).toEqual({ x: 50, y: 60 });
  });

  it('applies a remote add, relabel, reweight and removal', () => {
    const author = createClient();
    const peer = createClient(author.doc);

    author.graph.actions.addElements({
      nodes: [{ id: 'c', label: 'C', position: { x: 7, y: 8 } }],
      edges: [{ id: 'a-c', source: 'a', target: 'c', weight: new Fraction(3) }],
    } as never);
    sync(author.doc, peer.doc);

    expect(peer.graph.isNode('c')).toBe(true);
    expect(peer.positionOf('c')).toEqual({ x: 7, y: 8 });
    expect(peer.graph.getEdge('a-c')?.weight.toString()).toBe('3');

    author.graph.weights.setMany([{ edgeId: 'a-c', update: new Fraction(9) }]);
    sync(author.doc, peer.doc);
    expect(peer.graph.getEdge('a-c')?.weight.toString()).toBe('9');

    author.graph.actions.removeElements({ nodes: [{ id: 'c' }], edges: [] });
    sync(author.doc, peer.doc);
    expect(peer.graph.isNode('c')).toBe(false);
    expect(peer.graph.isEdge('a-c')).toBe(false);
  });

  // the regression: a node takes its edges with it, so the peer applying the removal
  // has already cascaded the edge away by the time the document says to remove it
  it('applies a remote node removal whose edges this client has already lost', () => {
    const author = createClient();
    const peer = createClient(author.doc);

    author.graph.actions.addElements({
      nodes: [{ id: 'c', label: 'C', position: { x: 7, y: 8 } }],
      edges: [
        { id: 'a-c', source: 'a', target: 'c', weight: new Fraction(1) },
        { id: 'b-c', source: 'b', target: 'c', weight: new Fraction(1) },
      ],
    } as never);
    sync(author.doc, peer.doc);

    // both ends of the same edge go at once, each client cascading the edge itself
    author.graph.actions.removeElements({ nodes: [{ id: 'a' }], edges: [] });
    peer.graph.actions.removeElements({ nodes: [{ id: 'c' }], edges: [] });
    sync(author.doc, peer.doc);
    sync(peer.doc, author.doc);

    expect(author.graph.isNode('c')).toBe(false);
    expect(peer.graph.isNode('a')).toBe(false);
    expect([...author.doc.getMap('edges').keys()]).toEqual([]);
    expect([...peer.doc.getMap('edges').keys()]).toEqual([]);
  });

  // an edge added against a node a peer was removing at the same time resolves to an
  // edge no client can hold, and the document is the only place it can be cleared from
  it('clears an edge left dangling by a concurrent node removal', () => {
    const author = createClient();
    const peer = createClient(author.doc);

    author.graph.actions.removeElements({ nodes: [{ id: 'b' }], edges: [] });
    peer.graph.actions.addElements({
      nodes: [],
      edges: [{ id: 'a-b', source: 'a', target: 'b', weight: new Fraction(1) }],
    } as never);
    sync(author.doc, peer.doc);
    sync(peer.doc, author.doc);

    expect(peer.graph.isNode('b')).toBe(false);
    expect(peer.graph.isEdge('a-b')).toBe(false);
    expect(author.graph.isEdge('a-b')).toBe(false);
    expect([...author.doc.getMap('edges').keys()]).toEqual([]);
    expect([...peer.doc.getMap('edges').keys()]).toEqual([]);
  });

  it('keeps the tidy up off the undo stack of a client that made no edit', () => {
    const author = createClient();
    const drawer = createClient(author.doc);
    const watcher = createClient(author.doc);

    // the edge reaches the watcher but not the author, who is removing its endpoint
    drawer.graph.actions.addElements({
      nodes: [],
      edges: [{ id: 'a-b', source: 'a', target: 'b', weight: new Fraction(1) }],
    } as never);
    sync(drawer.doc, watcher.doc);
    author.graph.actions.removeElements({ nodes: [{ id: 'b' }], edges: [] });
    sync(author.doc, watcher.doc);

    expect(watcher.graph.isEdge('a-b')).toBe(false);
    expect([...watcher.doc.getMap('edges').keys()]).toEqual([]);
    expect(watcher.binding.history.canUndo.value).toBe(false);
  });

  // the regression: a full document diff read every in flight node as a move to undo
  it('leaves a node this user is dragging alone when a peer commits another', () => {
    const author = createClient();
    const dragger = createClient(author.doc);

    dragger.setLocallyDragged(['b']);
    const stream = dragger.graph.positions.createStream();
    dragBy(dragger.graph, stream, 'b', 40, 40);
    expect(dragger.positionOf('b')).toEqual({ x: 140, y: 140 });

    author.graph.positions.set({ nodeId: 'a', update: { x: 500, y: 500 } });
    sync(author.doc, dragger.doc);

    expect(dragger.positionOf('a')).toEqual({ x: 500, y: 500 });
    expect(dragger.positionOf('b')).toEqual({ x: 140, y: 140 });

    // the next frame of the same gesture builds on the live position, not a clobbered one
    dragBy(dragger.graph, stream, 'b', 10, 10);
    expect(dragger.positionOf('b')).toEqual({ x: 150, y: 150 });

    stream.stop();
    dragger.setLocallyDragged([]);
    expect(dragger.doc.getMap<{ x: number }>('nodes').get('b')?.x).toBe(150);
  });

  it('leaves a node a peer is dragging alone when another peer commits', () => {
    const author = createClient();
    const watcher = createClient(author.doc);

    watcher.binding.applyPeerDrag('peer-1', [
      { id: 'b', position: { x: 300, y: 300 } },
    ]);
    expect(watcher.positionOf('b')).toEqual({ x: 300, y: 300 });

    author.graph.positions.set({ nodeId: 'a', update: { x: 500, y: 500 } });
    sync(author.doc, watcher.doc);

    expect(watcher.positionOf('a')).toEqual({ x: 500, y: 500 });
    expect(watcher.positionOf('b')).toEqual({ x: 300, y: 300 });
  });

  it('reconciles a node again once its drag has ended', () => {
    const author = createClient();
    const watcher = createClient(author.doc);

    watcher.binding.applyPeerDrag('peer-1', [
      { id: 'b', position: { x: 300, y: 300 } },
    ]);
    watcher.binding.endPeerDrag('peer-1');

    author.graph.positions.set({ nodeId: 'b', update: { x: 20, y: 30 } });
    sync(author.doc, watcher.doc);

    expect(watcher.positionOf('b')).toEqual({ x: 20, y: 30 });
  });

  it('holds a node for the peer still dragging it when another lets go', () => {
    const author = createClient();
    const watcher = createClient(author.doc);

    watcher.binding.applyPeerDrag('peer-1', [
      { id: 'a', position: { x: 200, y: 200 } },
    ]);
    watcher.binding.applyPeerDrag('peer-2', [
      { id: 'b', position: { x: 300, y: 300 } },
    ]);
    watcher.binding.endPeerDrag('peer-1');

    author.graph.positions.setMany([
      { nodeId: 'a', update: { x: 1, y: 1 } },
      { nodeId: 'b', update: { x: 2, y: 2 } },
    ]);
    sync(author.doc, watcher.doc);

    expect(watcher.positionOf('a')).toEqual({ x: 1, y: 1 });
    expect(watcher.positionOf('b')).toEqual({ x: 300, y: 300 });
  });

  it('applies remote annotations', () => {
    const author = createClient();
    const peer = createClient(author.doc);

    const stroke: Annotation = {
      id: 'stroke-1',
      type: 'draw',
      points: [{ x: 0, y: 0 }],
      fillColor: 'red',
      brushWeight: 2,
    };
    author.annotationEvents.emit('onAnnotationsChanged', {
      added: [stroke],
      removedIds: [],
    } as never);
    sync(author.doc, peer.doc);
    expect(peer.annotationsOf().map(({ id }) => id)).toEqual(['stroke-1']);

    author.annotationEvents.emit('onAnnotationsChanged', {
      added: [],
      removedIds: ['stroke-1'],
    } as never);
    sync(author.doc, peer.doc);
    expect(peer.annotationsOf()).toEqual([]);
  });

  it('stops reconciling after unbind', () => {
    const author = createClient();
    const peer = createClient(author.doc);

    peer.binding.unbind();
    author.graph.positions.set({ nodeId: 'a', update: { x: 77, y: 88 } });
    sync(author.doc, peer.doc);

    expect(peer.positionOf('a')).toEqual({ x: 0, y: 0 });
  });
});
