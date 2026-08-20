import {
  AggregatorTransformer,
  CanvasElement,
} from '@canvas/primitives/aggregator/types';
import { rect } from '@canvas/primitives/shapes/rect/index';

import { onMounted } from 'vue';

import { useComponentSlotsState } from '../component-slot/useComponentSlotsState.ts';
import { useLensState } from '../lens/useLensState.ts';
import { useMultiplayer } from '../multiplayer/useMultiplayer.ts';
import { useProductShortcuts } from '../shortcuts/useProductShortcuts.ts';
import { useShortcuts } from '../shortcuts/useShortcuts.ts';
import SimulationButtonGroup from '../simulation/start-buttons/ButtonGroup.vue';
import { useSimulationState } from '../simulation/useSimulationState.ts';
import { useAnnotationsUI } from '../ui/annotations/useAnnotationsUI.ts';
import { useProductAppearance } from '../ui/appearance/useProductAppearance.ts';
import { useDebugState } from '../ui/debug/useDebugState.ts';
import LensChipGroup from '../ui/lens-chips/LensChipGroup.vue';
import { loadFromLinkPayload } from '../ui/link-sharing/linkPayload.ts';
import { tierColor } from '../ui/multiplayer/tier.ts';
import { useProductUI } from '../ui/useProductUI.ts';
import { provideMagic } from './context.ts';
import { resolveProductFlags } from './flags.ts';
import { useProductHistory } from './internals/useProductHistory.ts';
import { useProductLocalStorage } from './internals/useProductLocalStorage.ts';
import { manifests } from './manifests/index.ts';
import { Magic, MagicProductHost, MagicProductOptions } from './types.ts';

export const useMagicProduct = (
  host: MagicProductHost,
  options: MagicProductOptions,
): Magic => {
  const componentSlots = useComponentSlotsState();
  const lens = useLensState(componentSlots);
  const simulation = useSimulationState(componentSlots, lens);

  const appearance = useProductAppearance(host.onAppearanceChanged);

  const annotations = host.annotations
    ? useAnnotationsUI(host.annotations, componentSlots)
    : undefined;

  const flags = resolveProductFlags(options.flags, host);

  useProductUI(componentSlots);
  const debug = useDebugState(componentSlots);
  const shortcuts = useShortcuts();

  const manifest = manifests[options.productId];

  const localStorage = useProductLocalStorage(manifest.id, host, flags);

  const { product: multiplayer, roomHistory } = useMultiplayer({
    host,
    productId: options.productId,
    componentSlots,
  });

  const history = useProductHistory({
    local: host.history,
    roomHistory,
    inRoom: () => multiplayer?.room.state.value.connected === true,
  });

  const magic: Magic = {
    manifest,
    flags,
    lens,
    componentSlots,
    simulation,
    appearance,
    shortcuts,
    debug,
    annotations,
    lensChips: options.lensChips,
    simulationButtons: options.simulationButtons,
    surface: host.surface,
    transit: host.transit,
    history,
    localStorage,
    multiplayer,
  };

  const nameTagElement: AggregatorTransformer = (agg) => {
    if (!magic.multiplayer?.room.state.value.connected) return agg;
    const roster = magic.multiplayer.room.state.value.userIdToRosterEntry;
    for (const [userId, p] of Object.entries(
      magic.multiplayer.room.state.value.userIdToPresence,
    )) {
      const el: CanvasElement = {
        id: userId + '_nameTag',
        priority: Infinity,
        shape: rect({
          at: p.cursorPosition ?? { x: 0, y: 0 },
          height: 20,
          width: 60,
          fillColor: tierColor[roster[userId].tier],
          borderRadius: 5,
          textArea: {
            textBlock: {
              // 1. test to see if the name is greater than 10 characters long
              // 2. if it is, truncate it to 8 characters and a '...'
              // 3. measure the text with canvas primitive text measuring tool
              // 4. ensure the width is snug on the displayed name
              content: roster[userId].displayName,
              fontWeight: 'bold',
              color: 'white',
            },
          },
        }),
      };
      agg.push(el);
    }
    return agg;
  };

  if (multiplayer) {
    magic.surface.aggregator.transformers.push(nameTagElement);
  }

  if (magic.lensChips) {
    magic.componentSlots.add({
      id: 'product/lens-chips',
      component: LensChipGroup,
      position: 'top-middle',
      // should always be stuck to the top
      priority: -Infinity,
    });
  }

  if (magic.simulationButtons) {
    magic.componentSlots.add({
      id: 'product/simulation-buttons',
      component: SimulationButtonGroup,
      position: 'bottom-middle',
      // should always be stuck to the bottom
      priority: Infinity,
    });
  }

  onMounted(() => {
    magic.localStorage.sync();
    // replace what was in local storage with what was in link
    if (magic.flags.linkSharing) loadFromLinkPayload(magic);

    // whatever was restored is the starting point, not the state setup began with
    magic.history?.clear();
  });

  useProductShortcuts(magic);
  provideMagic(magic);

  return magic;
};
