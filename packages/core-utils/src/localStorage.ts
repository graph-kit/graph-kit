import { devWarning } from './debugging.ts';

type LocalStorageGetter = (...args: any[]) => string;
type LocalStorageRecord = Record<string, string | LocalStorageGetter>;

/**
 * a registry for all localStorage keys this application uses
 */
export const localKeys = {
  /** nodes in graph product */
  nodes: (key: string) => `nodes-${key}` as const,
  /** edges in graph product */
  edges: (key: string) => `edges-${key}` as const,
  /** graph product simulation speed */
  simulationPlaybackSpeed: 'simulation-playback-speed',
  /** graph theme set by user - {@link Graph.preferredTheme} */
  preferredTheme: 'preferred-theme',
} as const satisfies LocalStorageRecord;

/**
 * all return values of localStorage are, by default, string.
 * this type allows string to be narrowed to types such as 'true' | 'false'
 */
type TypeOverride = {};

type LocalObj = typeof localKeys;

/**
 * @example
 * type T = TypeOrReturnType<number> // number
 * type TFunc = TypeOrReturnType<() => number> // number
 */
type TypeOrReturnType<T> = T extends (...args: any[]) => infer U ? U : T;

type LocalKeys = TypeOrReturnType<LocalObj[keyof LocalObj]>;
type LocalType<T extends LocalKeys> = T extends keyof TypeOverride
  ? TypeOverride[T]
  : string;

/**
 * perform **type safe** localStorage actions
 */
export const local = {
  get: <T extends LocalKeys>(key: T) => localStorage.getItem(key),
  set: <T extends LocalKeys, K extends LocalType<T>>(key: T, value: K) =>
    localStorage.setItem(key, value),
  remove: <T extends LocalKeys>(key: T) => localStorage.removeItem(key),
  clear: () => localStorage.clear(),
};

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
