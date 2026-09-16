import {
  effect as alienEffect,
  computed,
  endBatch,
  setActiveSub,
  signal,
  startBatch,
} from 'alien-signals';

export { reactiveMap, reactiveSet } from './collections.ts';
export type { ReactiveMap, ReactiveSet } from './collections.ts';

/** a readable and writable reactive value */
export type Signal<T> = {
  /** read value */
  (): T;
  /** write value */
  (value: T): void;
};

/** a derived value. recomputes lazily on read, only once its sources change. */
export type Computed<T> = () => T;

export { computed, signal };

/**
 * runs `fn` now and again whenever something it read changes. returns a stop function.
 *
 * whatever `fn` returns is taken as a cleanup and called before the next run.
 */
export const effect = alienEffect;

/** reads inside `fn` are not recorded as dependencies of the surrounding scope. */
export const untracked = <T>(fn: () => T): T => {
  const previousSub = setActiveSub(undefined);
  try {
    return fn();
  } finally {
    setActiveSub(previousSub);
  }
};

/** notifies effects once for the writes in `fn`. computed reads are lazy either way. */
export const batch = <T>(fn: () => T): T => {
  startBatch();
  try {
    return fn();
  } finally {
    endBatch();
  }
};
