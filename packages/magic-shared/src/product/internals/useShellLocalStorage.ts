import { debounce } from '@core/utils/debounce';
import { devWarning } from '@core/utils/debugging';
import { readLocalStorage, writeLocalStorage } from '@core/utils/localStorage';

import { ShellFlags } from '../flags.ts';
import { ProductControls, TransitField } from '../types.ts';

const DEBOUNCE_MS = 500;

const localStorageKey = (id: string) => 'product-data-' + id;

export type LocalStorageControls = {
  /**
   * Reports that the hosted product's state changed, persisting it on a
   * debounce.
   */
  invalidate: () => void;
  /**
   * Restores whatever was persisted.
   */
  sync: () => void;
};

const useLocalStorageSync = (
  productId: string,
  transit: TransitField,
): LocalStorageControls => {
  const key = localStorageKey(productId);

  const invalidate = debounce(() => {
    writeLocalStorage(key, JSON.stringify(transit.encode()));
  }, DEBOUNCE_MS);

  // no longer mounts itself: restoring now has to lose to a room, and only the
  // shell knows whether one answered. see the restore order in useShell
  const sync = () => {
    const data = readLocalStorage(key);
    if (!data) return;
    try {
      transit.decode(JSON.parse(data));
    } catch (error) {
      devWarning(
        `[shell] discarding unreadable saved state for ${productId}`,
        error,
      );
    }
  };

  return { invalidate, sync };
};

/** stands in when nothing is persisted */
const INERT: LocalStorageControls = {
  invalidate: () => {},
  sync: () => {},
};

export const useShellLocalStorage = (
  productId: string,
  host: Pick<ProductControls, 'transit'>,
  flags: ShellFlags,
): LocalStorageControls => {
  // flags already force localStorage off without transit, this proves it to the checker
  if (!flags.localStorage || !host.transit) return INERT;
  return useLocalStorageSync(productId, host.transit);
};
