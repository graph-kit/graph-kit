import { onMounted, watch } from 'vue';

import { useComponentSlotsState } from '../component-slot/useComponentSlotsState.ts';
import { useLensState } from '../lens/useLensState.ts';
import { useMultiplayer } from '../multiplayer/useMultiplayer.ts';
import { useShellShortcuts } from '../shortcuts/useShellShortcuts.ts';
import { useShortcuts } from '../shortcuts/useShortcuts.ts';
import SimulationButtonGroup from '../simulation/start-buttons/ButtonGroup.vue';
import { useSimulationState } from '../simulation/useSimulationState.ts';
import {
  ANIMATION_SPEED_DURATION_MS,
  readAnimationSpeed,
} from '../ui/animation-speed/speeds.ts';
import { useAnnotationsUI } from '../ui/annotations/useAnnotationsUI.ts';
import { useShellAppearance } from '../ui/appearance/useShellAppearance.ts';
import { useDebugState } from '../ui/debug/useDebugState.ts';
import { useHelpMenuState } from '../ui/help-menu/useHelpMenuState.ts';
import JumpToContentButton from '../ui/jump-to-content/JumpToContentButton.vue';
import LensChipGroup from '../ui/lens-chips/LensChipGroup.vue';
import { loadFromLinkPayload } from '../ui/link-sharing/linkPayload.ts';
import { useToastState } from '../ui/toast/useToastState.ts';
import { useShellUI } from '../ui/useShellUI.ts';
import { provideShell } from './context.ts';
import { resolveShellFlags } from './flags.ts';
import { useJumpToContent } from './internals/useJumpToContent.ts';
import { useShellHistory } from './internals/useShellHistory.ts';
import { useShellLocalStorage } from './internals/useShellLocalStorage.ts';
import { manifests } from './manifests/index.ts';
import { ProductControls, Shell, ShellOptions } from './types.ts';

export const useShell = (
  host: ProductControls,
  options: ShellOptions,
): Shell => {
  const componentSlots = useComponentSlotsState();
  const lens = useLensState(componentSlots);
  const simulation = useSimulationState(componentSlots, lens);

  const appearance = useShellAppearance(host.onAppearanceChanged);

  const annotations = host.annotations
    ? useAnnotationsUI(host.annotations, componentSlots)
    : undefined;

  const flags = resolveShellFlags(options.flags, host);

  useShellUI(componentSlots);
  const debug = useDebugState(componentSlots);
  const shortcuts = useShortcuts();

  const manifest = manifests[options.productId];

  const localStorage = useShellLocalStorage(manifest.id, host, flags);
  const jumpToContent = useJumpToContent(host, flags);

  const { product: multiplayer, roomHistory } = useMultiplayer({
    host,
    productId: options.productId,
    componentSlots,
  });

  const history = useShellHistory({
    local: host.history,
    roomHistory,
    inRoom: () => multiplayer?.room.state.value.connected === true,
  });

  const shell: Shell = {
    manifest,
    flags,
    lens,
    componentSlots,
    simulation,
    appearance,
    shortcuts,
    debug,
    helpMenu: useHelpMenuState(),
    toast: useToastState(),
    annotations,
    lensChips: options.lensChips,
    simulationButtons: options.simulationButtons,
    surface: host.surface,
    transit: host.transit,
    history,
    localStorage,
    multiplayer,
    jumpToContent,
  };

  shell.surface.camera.events.subscribe(
    'onCameraChange',
    localStorage.invalidate,
  );

  const savedAnimationSpeed = readAnimationSpeed();
  if (savedAnimationSpeed) {
    host.surface.renderer.autoAnimate.setAnimationDuration(
      ANIMATION_SPEED_DURATION_MS[savedAnimationSpeed],
    );
  }

  // read-only has nothing to draw with, so the tools come out of standby with it and
  // the panel closes behind them on `onDeactivated`
  if (annotations && multiplayer) {
    watch(
      multiplayer.room.isReadonly,
      (isReadonly) => {
        if (isReadonly) annotations.deactivate();
      },
      { immediate: true },
    );
  }

  if (shell.lensChips) {
    shell.componentSlots.add({
      id: 'shell/lens-chips',
      component: LensChipGroup,
      position: 'top-middle',
      // should always be stuck to the top
      priority: -Infinity,
    });
  }

  if (shell.jumpToContent) {
    shell.componentSlots.add({
      id: 'shell/jump-to-content',
      component: JumpToContentButton,
      position: 'bottom-middle',
      priority: -Infinity,
    });
  }

  if (shell.simulationButtons) {
    shell.componentSlots.add({
      id: 'shell/simulation-buttons',
      component: SimulationButtonGroup,
      position: 'bottom-middle',
      // should always be stuck to the bottom
      priority: Infinity,
    });
  }

  onMounted(() => {
    shell.localStorage.sync();
    // replace what was in local storage with what was in link
    if (shell.flags.linkSharing) loadFromLinkPayload(shell);

    // whatever was restored is the starting point, not the state setup began with
    shell.history?.clear();
  });

  useShellShortcuts(shell);
  provideShell(shell);

  return shell;
};
