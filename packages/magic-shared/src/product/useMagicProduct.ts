import { onMounted } from 'vue';

import { useComponentSlotsState } from '../component-slot/useComponentSlotsState.ts';
import { useLensState } from '../lens/useLensState.ts';
import { useMultiplayer } from '../multiplayer/useMultiplayer.ts';
import { useProductShortcuts } from '../shortcuts/useProductShortcuts.ts';
import { useShortcuts } from '../shortcuts/useShortcuts.ts';
import { useSimulationState } from '../simulation/useSimulationState.ts';
import { useAnnotationsState } from '../ui/annotations/useAnnotationsState.ts';
import { useProductAppearance } from '../ui/appearance/useProductAppearance.ts';
import { loadFromLinkPayload } from '../ui/link-sharing/linkPayload.ts';
import { useProductUI } from '../ui/useProductUI.ts';
import { provideMagic } from './context.ts';
import { useLocalStorageSync } from './internals/useLocalStorageSync.ts';
import { useProductHistory } from './internals/useProductHistory.ts';
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

  useProductUI(componentSlots, options.flags);
  const shortcuts = useShortcuts();

  const manifest = manifests[options.productId];

  const localStorage = options.flags.localStorage
    ? useLocalStorageSync(manifest.id, host.transit)
    : { invalidate: () => {}, sync: () => {} };

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
    flags: options.flags,
    lens,
    componentSlots,
    simulation,
    appearance,
    shortcuts,
    annotations,
    lensChips: options.lensChips,
    surface: host.surface,
    transit: host.transit,
    history,
    localStorage,
    multiplayer,
  };

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
