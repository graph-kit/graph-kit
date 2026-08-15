import { debounce } from '@core/utils/debounce';

import { TransitField } from '../types.ts';

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

export const useLocalStorageSync = (
  productId: string,
  transit: TransitField,
): LocalStorageControls => {
  const key = localStorageKey(productId);

  const invalidate = debounce(() => {
    window?.localStorage.setItem(key, JSON.stringify(transit.encode()));
  }, 500);

  // no longer mounts itself: restoring now has to lose to a room, and only the
  // harness knows whether one answered. see the restore order in useMagicProduct
  const sync = () => {
    const data = window?.localStorage.getItem(key);
    if (!data) return;
    transit.decode(JSON.parse(data));
  };

  return { invalidate, sync };
};
