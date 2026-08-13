import { watch } from 'vue';

import { ProductId } from '../product/manifests/index.ts';
import { SimulationControls } from '../simulation/useSimulationState.ts';
import { MultiplayerControls } from './createMultiplayer.ts';

/**
 * Commit boundary simulations pass through states that are not valid graphs. AVL is the
 * clearest case: its sync removes every node and re-adds the whole tree on each frame,
 * with fresh ids, so mirroring a scrub would broadcast a flood of remove-all/add-all
 * churn and a genuinely empty graph between every pair.
 *
 * Suspension is entirely client side. The server keeps broadcasting to everyone as
 * normal; this is the harness unilaterally declining to send or apply for one product.
 *
 * On exit the local state is pushed wholesale rather than reconciled. If the room moved
 * while the trace ran, that trace was already invalid the moment it moved, so there is
 * nothing to merge.
 */
export const useSimulationSuspension = (
  simulation: SimulationControls,
  productId: ProductId,
  multiplayer: MultiplayerControls,
  pushWholeState: () => void,
) => {
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
