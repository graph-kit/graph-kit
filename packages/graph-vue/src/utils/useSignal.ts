import { effect } from '@reactive/primitives/index';

import { type Ref, customRef, onScopeDispose } from 'vue';

/**
 * bridges a signal or computed from `@reactive/primitives` into a vue ref.
 *
 * the only effect in the system. everything inside the SDK is pull based, and vue's
 * renderer is push based, so exactly one place has to convert between them. keeping it
 * to this file is what stops ordering hazards from spreading.
 *
 * subscribing is what costs: `effect` has to read `source` to record it as a dependency,
 * and from then on every change re-reads it whether or not a template wants the result.
 * so the subscription waits until something reads the ref. a derivation nothing renders
 * is never computed at all, which is what keeps an expensive plugin off the bill of the
 * products that do not use it.
 *
 * alien-signals exposes no way to hear that a computed went stale without evaluating it,
 * so the eagerness returns once the first read happens. that is the right shape anyway:
 * something is now rendering the value, so it has to be recomputed when it changes.
 */
export const useSignal = <T>(source: () => T) => {
  let stop: (() => void) | undefined;
  let subscribed = false;
  let latest: T;

  onScopeDispose(() => stop?.(), true);

  return customRef<T>((track, trigger) => ({
    get() {
      track();

      if (!stop) {
        stop = effect(() => {
          latest = source();
          // the first run is this very read, which vue is already resolving
          if (subscribed) trigger();
        });
        subscribed = true;
      }

      return latest;
    },

    // read only, like the computed this replaced. writes belong on the source
    set() {},
  })) as Readonly<Ref<T>>;
};

/** `useSignal` across an object of signals, keeping the keys. */
export const useSignals = <Sources extends Record<string, () => unknown>>(
  sources: Sources,
) =>
  Object.fromEntries(
    Object.entries(sources).map(([key, source]) => [key, useSignal(source)]),
  ) as {
    [Key in keyof Sources]: ReturnType<
      typeof useSignal<ReturnType<Sources[Key]>>
    >;
  };
