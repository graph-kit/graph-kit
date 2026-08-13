import { onMounted, ref } from 'vue';

import { useComponentSlotsState } from '../component-slot/useComponentSlotsState.ts';
import { useLensState } from '../lens/useLensState.ts';
import { useMultiplayerProduct } from '../multiplayer/useMultiplayerProduct.ts';
import { useProductShortcuts } from '../shortcuts/useProductShortcuts.ts';
import { useShortcuts } from '../shortcuts/useShortcuts.ts';
import { useSimulationState } from '../simulation/useSimulationState.ts';
import { useAnnotationsState } from '../ui/annotations/useAnnotationsState.ts';
import { useProductAppearance } from '../ui/appearance/useProductAppearance.ts';
import { loadFromLinkPayload } from '../ui/link-sharing/linkPayload.ts';
import RoomPanel from '../ui/multiplayer/RoomPanel.vue';
import { useProductUI } from '../ui/useProductUI.ts';
import { provideMagic } from './context.ts';
import { useLocalStorageSync } from './internals/useLocalStorageSync.ts';
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

  const annotations = options.annotations
    ? useAnnotationsState(options.annotations, appearance)
    : undefined;

  const ui = useProductUI(componentSlots, options.ui);
  const shortcuts = useShortcuts();

  const manifest = manifests[options.productId];

  const localStorage = options.localStorage
    ? useLocalStorageSync(manifest.id, host.transit)
    : { invalidate: () => {}, sync: () => {} };

  const multiplayer = useMultiplayerProduct(
    options.productId,
    host.multiplayer,
  );

  // true until the product knows what it is showing. the canvas is gated on it so a
  // room never appears as a flash of local content replaced a moment later
  const restoring = ref(true);

  const magic: Magic = {
    manifest,
    lens,
    componentSlots,
    simulation,
    ui,
    appearance,
    shortcuts,
    annotations,
    lensChips: options.lensChips,
    surface: host.surface,
    transit: host.transit,
    history: host.history,
    localStorage,
    multiplayer,
    restoring,
  };

  // ORDER MATTERS!
  // a room wins over everything: it is authoritative, and painting local content first
  // would flash content that is about to be replaced.
  // then local storage before link share, otherwise local storage content loads on top
  // of a shared link.
  const restoreLocal = () => {
    localStorage.sync();
    if (magic.ui.linkSharing) loadFromLinkPayload(magic);
  };

  onMounted(async () => {
    try {
      // the only async step in startup. a product not in a room, or one with
      // multiplayer switched off, resolves immediately to 'local'
      const source = await multiplayer?.enterProduct(
        options.productId,
        host.multiplayer,
      );
      if (source !== 'room') restoreLocal();
    } finally {
      restoring.value = false;
    }
  });

  if (multiplayer) {
    componentSlots.add({
      id: 'product/room-panel',
      component: RoomPanel,
      position: 'top-right',
    });
  }

  useProductShortcuts(magic);
  provideMagic(magic);

  return magic;
};
