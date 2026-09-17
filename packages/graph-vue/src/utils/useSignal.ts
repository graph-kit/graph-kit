import { devWarning } from '@core/utils/debugging';
import { effect } from '@reactive/primitives/index';

import { type Ref, customRef, onScopeDispose } from 'vue';

/**
 * bridges a signal or computed from `@reactive/primitives` into a vue ref.
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

    set() {
      devWarning(
        '[graph/vue] Ignored a write to a signal backed ref. Write to the source signal instead',
      );
    },
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
