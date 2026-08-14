import Fraction from 'fraction.js';
import * as Y from 'yjs';

import { Graph } from '../graph/types.ts';

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
 * Marks writes this binding makes into the document, so its own observer skips them.
 * Distinct from the connection's remote origin, which decides what goes on the wire.
 */
const BINDING_ORIGIN = Symbol('graph-product/binding');

const readNodes = (doc: Y.Doc) => doc.getMap<DocNode>('nodes');
const readEdges = (doc: Y.Doc) => doc.getMap<DocEdge>('edges');

const nodeFromGraph = (graph: Graph, nodeId: string): DocNode => {
  const { x, y } = graph.positions.get(nodeId);
  return { x, y, label: graph.getNode(nodeId)?.label ?? '?' };
};

const edgeFromGraph = (graph: Graph, edgeId: string): DocEdge | undefined => {
  const edge = graph.getEdge(edgeId);
  if (!edge) return undefined;
  return {
    source: edge.source,
    target: edge.target,
    weight: edge.weight.toString(),
  };
};

/**
 * Ties a graph to a room document, in both directions, for the life of the product.
 *
 * An empty document means nobody has opened this product in the room yet, so the graph
 * seeds it. Otherwise the document is authoritative and the graph is rebuilt from it.
 */
export const bindGraphToDoc = (graph: Graph, doc: Y.Doc): void => {
  const nodes = readNodes(doc);
  const edges = readEdges(doc);

  // graph events emit synchronously inside the mutation's own stack frame, so a handler
  // always observes the flag the apply that triggered it set
  let applyingFromDoc = false;

  const intoDoc = (write: () => void) => {
    if (applyingFromDoc) return;
    doc.transact(write, BINDING_ORIGIN);
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
    });
  };

  // one action on this side for one change on the other, so the receiver derives the
  // same consequences the author's own action did
  const applyDocChange = () => {
    intoGraph(() => {
      const graphNodeIds = new Set(graph.nodes.value.map((node) => node.id));
      const graphEdgeIds = new Set(graph.edges.value.map((edge) => edge.id));

      const removedNodeIds = [...graphNodeIds].filter((id) => !nodes.has(id));
      const removedEdgeIds = [...graphEdgeIds].filter((id) => !edges.has(id));
      // removals first, since an action that replaced an element shows up as both
      if (removedNodeIds.length > 0 || removedEdgeIds.length > 0) {
        graph.actions.removeElements({
          nodes: removedNodeIds.map((id) => ({ id })),
          edges: removedEdgeIds.map((id) => ({ id })),
        });
      }

      const addedNodes = [...nodes.entries()]
        .filter(([id]) => !graphNodeIds.has(id))
        .map(([id, node]) => ({
          id,
          label: node.label,
          position: { x: node.x, y: node.y },
        }));
      const addedEdges = [...edges.entries()]
        .filter(([id]) => !graphEdgeIds.has(id))
        .map(([id, edge]) => ({
          id,
          source: edge.source,
          target: edge.target,
          weight: new Fraction(edge.weight),
        }));
      if (addedNodes.length > 0 || addedEdges.length > 0) {
        graph.actions.addElements({ nodes: addedNodes, edges: addedEdges });
      }

      const moved = [...nodes.entries()]
        .filter(([id]) => graph.nodes.value.some((node) => node.id === id))
        .filter(([id, node]) => {
          const position = graph.positions.get(id);
          return position.x !== node.x || position.y !== node.y;
        })
        .map(([id, node]) => ({
          nodeId: id,
          update: { x: node.x, y: node.y },
        }));
      if (moved.length > 0) graph.positions.setMany(moved);

      const relabeled = [...nodes.entries()]
        .filter(([id, node]) => graph.getNode(id)?.label !== node.label)
        .map(([id, node]) => ({ nodeId: id, label: node.label }));
      if (relabeled.length > 0) graph.nodeLabel.setMany(relabeled);

      const reweighted = [...edges.entries()]
        .filter(([id, edge]) => {
          const live = graph.getEdge(id);
          return live !== undefined && live.weight.toString() !== edge.weight;
        })
        .map(([id, edge]) => ({
          edgeId: id,
          update: new Fraction(edge.weight),
        }));
      if (reweighted.length > 0) graph.weights.setMany(reweighted);
    });
  };

  const observe = () => {
    // the document is the source for everything except what this binding just wrote
    const onChange = (_: unknown, transaction: Y.Transaction) => {
      if (transaction.origin === BINDING_ORIGIN) return;
      applyDocChange();
    };
    nodes.observe(onChange);
    edges.observe(onChange);
  };

  // rawEvents rather than graph.events, whose subscribe registers an onUnmounted per
  // call: binding happens after the join resolves, so there is no component instance
  // left to attach to. these live as long as the graph does, which is the intent anyway.
  //
  // subscription driven rather than watcher driven: the suppression flag only holds
  // because graph events emit synchronously
  const subscribeGraph = () => {
    graph.rawEvents.subscribe(
      'onElementsAdded',
      ({ addedNodes, addedEdges }) => {
        intoDoc(() => {
          for (const node of addedNodes) {
            nodes.set(node.id, nodeFromGraph(graph, node.id));
          }
          for (const added of addedEdges) {
            const edge = edgeFromGraph(graph, added.id);
            if (edge) edges.set(added.id, edge);
          }
        });
      },
    );

    graph.rawEvents.subscribe(
      'onElementsRemoved',
      ({ removedNodeIds, removedEdgeIds }) => {
        intoDoc(() => {
          // edges first so the room never holds an edge whose endpoint is already gone
          for (const edgeId of removedEdgeIds) edges.delete(edgeId);
          for (const nodeId of removedNodeIds) nodes.delete(nodeId);
        });
      },
    );

    // the settled move rather than onNodeMoveStream, which would send one message per frame
    graph.rawEvents.subscribe('onNodePositionsCommitted', (positions) => {
      intoDoc(() => {
        for (const { nodeId } of positions) {
          if (!nodes.has(nodeId)) continue;
          nodes.set(nodeId, nodeFromGraph(graph, nodeId));
        }
      });
    });

    graph.rawEvents.subscribe('onEdgeWeightsChanged', (weights) => {
      intoDoc(() => {
        for (const { edgeId } of weights) {
          const edge = edgeFromGraph(graph, edgeId);
          if (edge) edges.set(edgeId, edge);
        }
      });
    });

    // an undo or a link load replaces the whole graph at once, and there is no per
    // element event describing what changed
    graph.rawEvents.transit.subscribe('onDecoded', writeWholeGraph);
  };

  if (nodes.size === 0 && edges.size === 0) {
    writeWholeGraph();
  } else {
    readWholeDoc();
  }

  observe();
  subscribeGraph();
};
