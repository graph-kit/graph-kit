import { CanvasElement } from '@canvas/primitives/aggregator/types';
import { nullThrows } from '@core/utils/assert';
import { CoreEdge, CoreNode } from '@graph/primitives/types';

import { CANVAS_ELEMENT_CURSOR_FIELD_KEY } from '../canvas/setupCanvasCursor.ts';
import { createLabelThemer } from './createLabelThemer.ts';
import {
  PhantomEdge,
  PhantomElementIds,
  PhantomElements,
  PhantomNode,
  PhantomPlugin,
} from './types.ts';

export const phantom: PhantomPlugin = ({
  controls,
  events,
  finalRenderFunctions: renderFunctions,
  finalTokenResolver,
}) => {
  let nodes: PhantomNode[] = [];
  let edges: PhantomEdge[] = [];

  const getNodePosition = (id: string) => {
    if (controls.isNode(id)) return controls.positions.get(id);
    return nullThrows(
      nodes.find((node) => node.id === id),
      `could not resolve position for node with id ${id}`,
    ).position;
  };

  const getNode = (id: string) => ({ id, position: getNodePosition(id) });

  const render = (elements: CanvasElement[]) => {
    // nodes in graph rendered on a priority level between [2, 3)
    const NODE_RENDER_PRIORITY = 2;
    // edges in graph rendered on priority level 1
    const EDGE_RENDER_PRIORITY = 1;
    for (const node of nodes) {
      elements.push({
        id: node.id,
        priority: NODE_RENDER_PRIORITY,
        shape: renderFunctions.node()(node),
        data: {
          [CANVAS_ELEMENT_CURSOR_FIELD_KEY]: finalTokenResolver(
            'node.cursor',
            node,
          ),
        },
      });
    }
    for (const edge of edges) {
      elements.push({
        id: edge.id,
        priority: EDGE_RENDER_PRIORITY,
        shape: renderFunctions.edge()({
          id: edge.id,
          source: getNode(edge.source),
          target: getNode(edge.target),
        }),
        data: {
          [CANVAS_ELEMENT_CURSOR_FIELD_KEY]: finalTokenResolver(
            'edge.cursor',
            edge,
          ),
        },
      });
    }
    return elements;
  };

  const labelThemer = createLabelThemer(
    controls,
    ({ id }) =>
      nodes.find((n) => n.id === id)?.label ??
      edges.find((e) => e.id === id)?.label,
  );
  labelThemer.enable();

  controls.canvas.aggregator.transformers.push(render);

  const addNode = (node: PhantomNode) => {
    nodes.push(node);
  };

  const addEdge = (edge: PhantomEdge) => {
    edges.push(edge);
  };

  const addElements = (elements: PhantomElements) => {
    nodes.push(...elements.nodes);
    edges.push(...elements.edges);
  };

  const removeElements = ({ nodeIds, edgeIds }: PhantomElementIds) => {
    const nodeIdsToRemove = new Set(nodeIds);
    const edgeIdsToRemove = new Set(edgeIds);

    const removedNodeIds = nodes
      .filter((node) => nodeIdsToRemove.has(node.id))
      .map((node) => node.id);

    // a removed node takes its edges with it, same as the core removeNode action
    const removedEdgeIds = edges
      .filter(
        (edge) =>
          edgeIdsToRemove.has(edge.id) ||
          nodeIdsToRemove.has(edge.source) ||
          nodeIdsToRemove.has(edge.target),
      )
      .map((edge) => edge.id);

    const removedEdgeIdSet = new Set(removedEdgeIds);
    nodes = nodes.filter((node) => !nodeIdsToRemove.has(node.id));
    edges = edges.filter((edge) => !removedEdgeIdSet.has(edge.id));

    return { removedNodeIds, removedEdgeIds };
  };

  const removeNode = (nodeId: CoreNode['id']) =>
    removeElements({ nodeIds: [nodeId], edgeIds: [] });

  const removeEdge = (edgeId: CoreEdge['id']) => {
    removeElements({ nodeIds: [], edgeIds: [edgeId] });
  };

  const removeAllNodes = () =>
    removeElements({ nodeIds: nodes.map((node) => node.id), edgeIds: [] });

  const removeAllEdges = () =>
    removeElements({ nodeIds: [], edgeIds: edges.map((edge) => edge.id) });

  const removeAllElements = () =>
    removeElements({
      nodeIds: nodes.map((node) => node.id),
      edgeIds: edges.map((edge) => edge.id),
    });

  const isNode = (id: string) => nodes.some((node) => node.id === id);

  const isEdge = (id: string) => edges.some((edge) => edge.id === id);

  const canResolveNode = (nodeId: CoreNode['id']) =>
    controls.isNode(nodeId) || isNode(nodeId);

  // a phantom edge may point at a real node, so a removed node leaves it dangling and
  // getNodePosition throws on the next frame, taking the whole render pass with it.
  // resolved against current state rather than the event payload because a transit
  // decode reports every pre-decode node as removed, including the ones it restored
  const dropDanglingEdges = () => {
    edges = edges.filter(
      (edge) => canResolveNode(edge.source) && canResolveNode(edge.target),
    );
  };

  events.subscribe('onNodesRemoved', dropDanglingEdges);

  return {
    name: 'phantom',
    controls: {
      addNode,
      addEdge,
      addElements,
      removeNode,
      removeEdge,
      removeElements,
      removeAllNodes,
      removeAllEdges,
      removeAllElements,
      nodes: () => nodes,
      edges: () => edges,
      isNode,
      isEdge,
      getNodePosition,
    },
  };
};
