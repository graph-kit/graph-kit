import { devWarning } from './debugging.ts';

/**
 * firefox with strict tracking protection and safari with cookies blocked throw on
 * `window.localStorage` itself rather than handing back an empty store, so the store is
 * probed once here instead of every call site guarding the access it makes
 */
export const createWebStorage = (name: 'localStorage' | 'sessionStorage') => {
  let store: Storage | null | undefined;

  const getStore = () => {
    if (typeof window === 'undefined') return null;
    if (store !== undefined) return store;
    try {
      store = window[name];
    } catch {
      store = null;
      devWarning(
        `[core] ${name} is blocked, nothing will persist this session`,
      );
    }
    return store;
  };

  /** reads a key, yielding null when the browser refuses rather than throwing */
  const read = (key: string) => {
    const store = getStore();
    if (!store) return null;
    try {
      return store.getItem(key);
    } catch (error) {
      devWarning(`[core] could not read "${key}" from ${name}`, error);
      return null;
    }
  };

  /** writes a key, giving up quietly when the browser refuses or the quota is spent */
  const write = (key: string, value: string) => {
    const store = getStore();
    if (!store) return;
    try {
      store.setItem(key, value);
    } catch (error) {
      devWarning(`[core] could not write "${key}" to ${name}`, error);
    }
  };

  const clear = (key: string) => {
    const store = getStore();
    if (!store) return;
    try {
      store.removeItem(key);
    } catch (error) {
      devWarning(`[core] could not clear "${key}" from ${name}`, error);
    }
  };

  return { read, write, clear };
};
