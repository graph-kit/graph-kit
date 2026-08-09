import { debounce } from '@core/utils/debounce';

import { onMounted } from 'vue';

import { LocalStorageField, TransitField } from '../types.ts';

const localStorageKey = (id: string) => 'product-data-' + id;

export const useLocalStorageSync = (
  productId: string,
  transit: TransitField,
): LocalStorageField => {
  const key = localStorageKey(productId);

  const save = debounce(() => {
    window?.localStorage.setItem(key, JSON.stringify(transit.encode()));
  }, 500);

  const sync = () => {
    const data = window?.localStorage.getItem(key);
    if (!data) return;
    transit.decode(JSON.parse(data));
  };

  onMounted(sync);

  return { invalidate: save };
};
