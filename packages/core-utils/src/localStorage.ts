import { devWarning } from './debugging.ts';

let store: Storage | null | undefined;

/**
 * firefox with strict tracking protection and safari with cookies blocked throw on
 * `window.localStorage` itself rather than handing back an empty store, so the store is
 * probed once here instead of every call site guarding the access it makes
 */
const getStore = () => {
  if (typeof window === 'undefined') return null;
  if (store !== undefined) return store;
  try {
    store = window.localStorage;
  } catch {
    store = null;
    devWarning(
      '[core] localStorage is blocked, nothing will persist this session',
    );
  }
  return store;
};

/** reads a key, yielding null when the browser refuses rather than throwing */
export const readLocalStorage = (key: string) => {
  const store = getStore();
  if (!store) return null;
  try {
    return store.getItem(key);
  } catch (error) {
    devWarning(`[core] could not read "${key}" from localStorage`, error);
    return null;
  }
};

/** writes a key, giving up quietly when the browser refuses or the quota is spent */
export const writeLocalStorage = (key: string, value: string) => {
  const store = getStore();
  if (!store) return;
  try {
    store.setItem(key, value);
  } catch (error) {
    devWarning(`[core] could not write "${key}" to localStorage`, error);
  }
};
