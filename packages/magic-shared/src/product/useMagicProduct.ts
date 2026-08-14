import { onMounted } from 'vue';

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
  };

  // ORDER MATTERS!
  // multiplayer wins, then local storage and link share load
  const restoreLocal = () => {
    magic.localStorage.sync();
    // replace what was in local storage with what was in link
    if (magic.ui.linkSharing) loadFromLinkPayload(magic);
  };

  onMounted(async () => {
    // the only async step in startup. a product not in a room, or one with
    // multiplayer switched off, resolves immediately to 'local'
    const source = await magic.multiplayer?.actions.product.enter(
      options.productId,
      host.multiplayer,
    );
    if (source !== 'room') restoreLocal();
  });

  if (magic.manifest.multiplayer) {
    magic.componentSlots.add({
      id: 'product/room-panel',
      component: RoomPanel,
      position: 'center-right',
    });
  }

  useProductShortcuts(magic);
  provideMagic(magic);

  return magic;
};
