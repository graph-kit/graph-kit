import { useGraph } from '../graph/useGraph.ts';
import { MagicProductHost } from '../product/types.ts';
import { resolveProductFlags } from '../product/flags.ts';
import { useMagicProduct } from '../product/useMagicProduct.ts';
import LensChipGroup from '../ui/lens-chips/LensChipGroup.vue';
import { bindGraphToDoc } from './bindGraphToDoc.ts';
import { provideGraph } from './context.ts';
import { useGraphProductShortcuts } from './shortcuts.ts';
import { trackDraggedNodes } from './trackDraggedNodes.ts';
import { GraphProductOptions, MagicGraph } from './types.ts';

/** adapts a graph to the harness host interface, see {@link useMagicProduct} */
export const useGraphProduct = (options: GraphProductOptions): MagicGraph => {
  const graph = useGraph(options);

  const lensChips = options.lensChips?.(graph);

  const draggedNodes = trackDraggedNodes(graph);

  const flags = resolveProductFlags(options.flags);

  if (!flags.history) graph.history.lifecycle.disable();

  const host: MagicProductHost = {
    surface: graph.canvas.surface,
    transit: graph.transit,
    history: flags.history ? graph.history : undefined,
    onAppearanceChanged: (color) =>
      (graph.theme.activePresetName.value = color),
    multiplayer: {
      bind: (doc) => bindGraphToDoc(graph, doc, draggedNodes.isDragging),
      draggedElements: draggedNodes.elements,
    },
  };

  const magic = useMagicProduct(host, {
    productId: options.productId,
    flags,
    annotations: flags.annotations ? graph.canvas : undefined,
    lensChips,
  });

  graph.events.subscribe('onStructureChange', magic.simulation.invalidate);

  graph.events.subscribe('onStructureChange', magic.localStorage.invalidate);
  // any settled move, not just a drag drop, so programmatic repositioning persists too
  graph.events.subscribe(
    'onNodePositionsCommitted',
    magic.localStorage.invalidate,
  );

  if (magic.lensChips) {
    magic.componentSlots.add({
      id: 'product/lens-chips',
      component: LensChipGroup,
      position: 'top-middle',
    });
  }

  useGraphProductShortcuts(magic, graph);

  provideGraph(graph);

  return {
    ...graph,
    magic,
  };
};
