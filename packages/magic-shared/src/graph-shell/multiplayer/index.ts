import { Graph } from '../../graph/index.ts';
import { MultiplayerControls } from '../../product/index.ts';
import { bindGraphToDoc } from './bindGraphToDoc.ts';
import { trackDraggedNodes } from './trackDraggedNodes.ts';

export const multiplayerControls = (graph: Graph): MultiplayerControls => {
  const draggedNodes = trackDraggedNodes(graph);

  return {
    bind: (doc, mode) =>
      bindGraphToDoc(graph, doc, mode, draggedNodes.isDragging),
    drag: draggedNodes.events,
    tiers: {
      host: {},
      admin: {},
      write: {},
      read: {
        enter: graph.readonly.enter,
        exit: graph.readonly.exit,
      },
    },
  };
};
