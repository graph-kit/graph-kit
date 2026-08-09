import { useGraph } from '../graph/useGraph.ts';
import { useGraphProductShortcuts } from '../shortcuts/useProductShortcuts.ts';
import LensChipGroup from '../ui/lens-chips/LensChipGroup.vue';
import { provideGraph } from './context.ts';
import { GraphProductOptions, MagicGraph, MagicProductHost } from './types.ts';
import { useMagicProduct } from './useMagicProduct.ts';

/** adapts a graph to the harness host interface, see {@link useMagicProduct} */
export const useGraphProduct = (options: GraphProductOptions): MagicGraph => {
  const graph = useGraph(options);

  const handleLocalStorageSave = (save: () => void) => {
    graph.events.subscribe('onStructureChange', save);
    graph.nodeDrag.events.subscribe('onNodeDrop', save);
  };

  const lensChips = options.lensChips?.(graph);

  const host: MagicProductHost = {
    surface: graph.canvas.surface,
    transit: graph.transit,
    history: graph.history,
    events: graph.events,
    setAppearance: (color) => (graph.theme.activePresetName.value = color),
  };

  const magic = useMagicProduct(host, {
    productId: options.productId,
    localStorage:
      options.localStorage === false ? undefined : handleLocalStorageSave,
    annotations: options.annotations === false ? undefined : graph.canvas,
    ui: options.ui,
    lensChips,
  });

  if (lensChips) {
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
