import { watch } from 'vue';

import { ProductId } from '../product/manifests/index.ts';
import { SimulationControls } from '../simulation/useSimulationState.ts';
import { MultiplayerControls } from './createMultiplayer.ts';

/**
 * Commit boundary simulations pass through states that are not valid graphs: AVL rebuilds
 * its whole tree each frame, so mirroring a scrub would broadcast remove-all/add-all
 * churn. On exit the local state is pushed wholesale rather than reconciled, since a
 * trace the room moved underneath was already invalid.
 */
export const useSimulationSuspension = (
  simulation: SimulationControls,
  productId: ProductId,
  multiplayer: MultiplayerControls,
  pushWholeState: () => void,
): void => {
  watch(
    () => simulation.current.value !== undefined,
    (running) => {
      if (running) {
        multiplayer.suspend(productId);
        return;
      }

      // push before resuming, so the state that lands is the trace's result rather
      // than whatever arrives in the gap
      multiplayer.resume(productId);
      pushWholeState();
    },
  );
};
