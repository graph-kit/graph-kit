import { CoreEdge } from '@graph/primitives/types';

import { CurryWithCoreGraph, NodeHelpers } from './types.ts';

type CurriedNodeHelpers = CurryWithCoreGraph<NodeHelpers>;

const getOutboundEdges: CurriedNodeHelpers['getOutboundEdges'] =
  (graph) => (nodeId) => {
    const { directed: isGraphDirected } = graph.metadata;

    const isUndirectedEdgeOutbound = (edge: CoreEdge) => {
      return edge.source === nodeId || edge.target === nodeId;
    };
    const isDirectedEdgeOutbound = (edge: CoreEdge) => {
      return edge.source === nodeId;
    };

    const edgeFilter = isGraphDirected
      ? isDirectedEdgeOutbound
      : isUndirectedEdgeOutbound;
    return graph.edges().filter(edgeFilter);
  };

const getInboundEdges: CurriedNodeHelpers['getInboundEdges'] =
  (graph) => (nodeId) => {
    const { directed: isGraphDirected } = graph.metadata;

    const isUndirectedEdgeInbound = (edge: CoreEdge) => {
      return edge.source === nodeId || edge.target === nodeId;
    };
    const isDirectedEdgeInbound = (edge: CoreEdge) => {
      return edge.target === nodeId;
    };

    const edgeFilter = isGraphDirected
      ? isDirectedEdgeInbound
      : isUndirectedEdgeInbound;
    return graph.edges().filter(edgeFilter);
  };

const getParents: CurriedNodeHelpers['getParents'] = (graph) => (nodeId) => {
  const inboundEdges = getInboundEdges(graph);
  return inboundEdges(nodeId)
    .map((edge) => edge.source)
    .map((nodeId) => graph.getNode(nodeId));
};

const getChildren: CurriedNodeHelpers['getChildren'] = (graph) => (nodeId) => {
  const outboundEdges = getOutboundEdges(graph);
  return outboundEdges(nodeId)
    .map((edge) => edge.target)
    .map((nodeId) => graph.getNode(nodeId));
};

const getConnectedEdges: CurriedNodeHelpers['getConnectedEdges'] =
  (graph) => (nodeId) =>
    graph
      .edges()
      .filter((edge) => edge.target === nodeId || edge.source === nodeId);

const getEdgeBetween: CurriedNodeHelpers['getEdgeBetween'] =
  (graph) => (fromNodeId, toNodeId) => {
    const { directed: isGraphDirected } = graph.metadata;

    return graph.edges().find((edge) => {
      if (isGraphDirected) {
        return edge.source === fromNodeId && edge.target === toNodeId;
      }

      return (
        (edge.source === fromNodeId && edge.target === toNodeId) ||
        (edge.source === toNodeId && edge.target === fromNodeId)
      );
    });
  };

export const getEdgesBetweenConnectedNodes =
  (edges: readonly CoreEdge[]) => (nodeId1: string, nodeId2: string) => {
    const isConnecting = (edge: CoreEdge) => {
      const fromNode1ToNode2 =
        edge.source === nodeId1 && edge.target === nodeId2;
      const fromNode2ToNode1 =
        edge.source === nodeId2 && edge.target === nodeId1;
      return fromNode1ToNode2 || fromNode2ToNode1;
    };

    return edges.filter(isConnecting);
  };

export const nodeHelpers: CurriedNodeHelpers = {
  getChildren,
  getConnectedEdges,
  getEdgeBetween,
  getEdgesBetweenConnectedNodes: (graph) =>
    getEdgesBetweenConnectedNodes(graph.edges()),
  getInboundEdges,
  getOutboundEdges,
  getParents,
};
