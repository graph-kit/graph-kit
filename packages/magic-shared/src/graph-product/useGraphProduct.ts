import { useGraph } from '../graph/useGraph.ts';
import { MagicProductHost } from '../product/types.ts';
import { useMagicProduct } from '../product/useMagicProduct.ts';
import LensChipGroup from '../ui/lens-chips/LensChipGroup.vue';
import { provideGraph } from './context.ts';
import { applyOpsToGraph } from './server-state-ops.ts';
import {
  isGraphServerState,
  serverStateFromTransit,
  transitFromServerState,
} from './server-state.ts';
import { useGraphProductShortcuts } from './shortcuts.ts';
import { GraphProductOptions, MagicGraph } from './types.ts';
import { useGraphOutboundSync } from './useGraphOutboundSync.ts';
import { usePresenceBroadcast } from './usePresenceBroadcast.ts';

/** adapts a graph to the harness host interface, see {@link useMagicProduct} */
export const useGraphProduct = (options: GraphProductOptions): MagicGraph => {
  const graph = useGraph(options);

  const lensChips = options.lensChips?.(graph);

  const host: MagicProductHost = {
    surface: graph.canvas.surface,
    transit: graph.transit,
    history: graph.history,
    onAppearanceChanged: (color) =>
      (graph.theme.activePresetName.value = color),
    multiplayer: {
      encode: () => serverStateFromTransit(graph.transit.encode()),
      validate: isGraphServerState,
      applyOps: (ops) => applyOpsToGraph(graph, ops),
      onForceResync: (state) => {
        // the local payload supplies the sections the room deliberately omits, so
        // adopting authoritative state never disturbs the camera this user has set
        graph.transit.decode(
          transitFromServerState(state, graph.transit.encode()),
        );
      },
    },
  };

  const magic = useMagicProduct(host, {
    productId: options.productId,
    localStorage: options.localStorage !== false,
    annotations: options.annotations === false ? undefined : graph.canvas,
    ui: options.ui,
    lensChips,
  });

  graph.events.subscribe('onStructureChange', magic.simulation.invalidate);

  graph.events.subscribe('onStructureChange', magic.localStorage.invalidate);
  // any settled move, not just a drag drop, so programmatic repositioning persists too
  graph.events.subscribe(
    'onNodePositionsCommitted',
    magic.localStorage.invalidate,
  );

  if (magic.multiplayer) {
    useGraphOutboundSync(graph, options.productId, magic.multiplayer);
    usePresenceBroadcast(graph, options.productId, magic.multiplayer);
  }

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
