import { isHighlightedExplainerElement } from '@magic/shared/explainer';
import { GNode, Graph } from '@magic/shared/graph';

export const showNodeLabel = (graph: Graph, id: GNode['id']) =>
  graph.anchors.parentNodeId() === id ||
  graph.focus.isFocused(id) ||
  isHighlightedExplainerElement(id);
