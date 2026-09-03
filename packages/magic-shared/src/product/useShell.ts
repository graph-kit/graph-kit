import { onMounted, watch } from 'vue';

import { useComponentSlotsState } from '../component-slot/useComponentSlotsState.ts';
import { useLensState } from '../lens/useLensState.ts';
import { useMultiplayer } from '../multiplayer/useMultiplayer.ts';
import { useOnboarding } from '../onboarding/index.ts';
import { useShellShortcuts } from '../shortcuts/useShellShortcuts.ts';
import { useShortcuts } from '../shortcuts/useShortcuts.ts';
import SimulationButtonGroup from '../simulation/start-buttons/ButtonGroup.vue';
import { useSimulationState } from '../simulation/useSimulationState.ts';
import { useProductVisit, useTelemetry } from '../telemetry/useTelemetry.ts';
import {
  ANIMATION_SPEED_DURATION_MS,
  readAnimationSpeed,
} from '../ui/animation-speed/speeds.ts';
import { useAnnotationsUI } from '../ui/annotations/useAnnotationsUI.ts';
import { useShellAppearance } from '../ui/appearance/useShellAppearance.ts';
import { useDebugState } from '../ui/debug/useDebugState.ts';
import { useShellDialog } from '../ui/dialog/useShellDialog.ts';
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

  const telemetry = useTelemetry(manifest.id);
  useProductVisit(telemetry);

  const localStorage = useShellLocalStorage(manifest.id, host, flags);
  const jumpToContent = useJumpToContent(host, flags);
  const onboarding = useOnboarding(host, flags, appearance, options.onboarding);

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
    helpMenu: useHelpMenuState(shortcuts, options.helpMenu),
    telemetry,
    toast: useToastState(),
    dialog: useShellDialog(),
    annotations,
    simulationButtons: options.simulationButtons,
    surface: host.surface,
    transit: host.transit,
    history,
    localStorage,
    multiplayer,
    jumpToContent,
    onboarding,
  };

  // built here rather than in the literal, so a chip can close over the shell it sits in
  shell.lensChips = options.lensChips?.(shell);

  shell.surface.camera.events.subscribe(
    'onCameraChange',
    localStorage.invalidate,
  );

  simulation.events.subscribe('onSimulationStarted', (simulationId) =>
    telemetry.track('simulation.started', { simulationId }),
  );
  simulation.events.subscribe('onSimulationEnded', (simulationId) =>
    telemetry.track('simulation.ended', { simulationId }),
  );

  host.annotations?.events.subscribe('onStrokeBegan', () =>
    onboarding?.close(),
  );

  const savedAnimationSpeed = readAnimationSpeed();
  if (savedAnimationSpeed) {
    host.surface.renderer.autoAnimate.setAnimationDuration(
      ANIMATION_SPEED_DURATION_MS[savedAnimationSpeed],
    );
  }

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
      priority: Infinity,
    });
  }

  onMounted(() => {
    shell.localStorage.sync();
    // replace what was in local storage with what was in link
    if (shell.flags.linkSharing) loadFromLinkPayload(shell);

    // whatever was restored is the starting point, not the state setup began with
    shell.history?.clear();

    shell.onboarding?.open();

    options.onSetupCompleted?.(shell);

    shell.dialog.open({
      title: 'Setup Complete',
      description: 'Its all setup now',
      actions: [{ textContent: 'Ok', onClick: () => {} }],
    });
  });

  useShellShortcuts(shell);
  provideShell(shell);

  return shell;
};
