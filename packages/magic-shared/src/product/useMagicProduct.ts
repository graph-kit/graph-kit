import {
  AggregatorTransformer,
  CanvasElement,
} from '@canvas/primitives/aggregator/types';
import { rect } from '@canvas/primitives/shapes/rect/index';
import { TEXT_BLOCK_DEFAULTS } from '@canvas/primitives/text/defaults';
import { getTextDimensions } from '@canvas/primitives/text/getTextDimensions';
import type { TextBlock } from '@canvas/primitives/text/types';

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

const NAME_TAG_HEIGHT = 20;
const NAME_TAG_PADDING_X = 8;
const NAME_TAG_MAX_CHARS = 10;
const NAME_TAG_TRUNCATED_CHARS = 8;

const toDisplayedName = (name: string) =>
  name.length > NAME_TAG_MAX_CHARS
    ? `${name.slice(0, NAME_TAG_TRUNCATED_CHARS)}...`
    : name;

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
      const textBlock: Required<TextBlock> = {
        ...TEXT_BLOCK_DEFAULTS,
        content: toDisplayedName(roster[userId].displayName),
        fontWeight: 'bold',
        color: 'white',
      };

      const el: CanvasElement = {
        id: userId + '_nameTag',
        priority: Infinity,
        paintOnly: true,
        shape: rect({
          at: p.cursorPosition ?? { x: 0, y: 0 },
          height: NAME_TAG_HEIGHT,
          width: getTextDimensions(textBlock).width + NAME_TAG_PADDING_X * 2,
          fillColor: tierColor[roster[userId].tier],
          borderRadius: 5,
          textArea: { textBlock },
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
