import { onMounted } from 'vue';

import { useComponentSlotsState } from '../component-slot/useComponentSlotsState.ts';
import { useLensState } from '../lens/useLensState.ts';
import { useProductShortcuts } from '../shortcuts/useProductShortcuts.ts';
import { useShortcuts } from '../shortcuts/useShortcuts.ts';
import { useSimulationState } from '../simulation/useSimulationState.ts';
import { useAnnotationsState } from '../ui/annotations/useAnnotationsState.ts';
import { useProductAppearance } from '../ui/appearance/useProductAppearance.ts';
import { loadFromLinkPayload } from '../ui/link-sharing/linkPayload.ts';
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

  const appearance = useProductAppearance(host.setAppearance);

  const annotations = options.annotations
    ? useAnnotationsState(options.annotations, appearance)
    : undefined;

  const ui = useProductUI(componentSlots, options.ui);
  const shortcuts = useShortcuts();

  const magic: Magic = {
    manifest: manifests[options.productId],
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
  };

  // ORDER MATTERS!
  // local storage before link share, otherwise local storage content loads on top of a shared link
  if (options.localStorage) {
    const triggerSave = useLocalStorageSync(magic);
    options.localStorage(triggerSave);
  }

  if (magic.ui.linkSharing) {
    onMounted(() => loadFromLinkPayload(magic));
  }

  useProductShortcuts(magic);
  provideMagic(magic);

  return magic;
};
