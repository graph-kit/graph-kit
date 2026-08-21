import { ReadonlyEventHub, createEventHub } from '@core/events/createEventHub';

import { LifecycleEventMap, createLifecycleEventRegistry } from './events.ts';

/** releases the suppression it was handed out for. calling it more than once does nothing */
export type ReleaseSuppression = () => void;

type PluginLifecycleControls = {
  /** Lifecycle management and runtime status */
  lifecycle: {
    /** Activates the plugin. */
    enable: () => void;
    /** Deactivates the plugin. */
    disable: () => void;
    /** @returns true if the plugin is currently active */
    isEnabled: () => boolean;
    /**
     * Holds the plugin disabled on behalf of an owner that outranks whoever else toggles it.
     * `enable` is recorded but not acted on until every suppression is released, so no window
     * opens where the plugin is briefly live.
     *
     * @param reason who is holding it down, for `suppressedBy` to report
     * @returns the {@link ReleaseSuppression | release} for this suppression alone
     * @example const release = graph.anchors.lifecycle.suppress('readonly')
     */
    suppress: (reason: string) => ReleaseSuppression;
    /**
     * for tracing who is holding a plugin down. nothing branches on it, so a reason is free
     * to say whatever makes the answer obvious at a breakpoint.
     *
     * @returns the reason of every suppression currently held, in the order they were taken
     */
    suppressedBy: () => string[];
    /** events for the plugin's lifecycle */
    events: ReadonlyEventHub<LifecycleEventMap>;
  };
};

export type WithLifecycle<PluginControls> = PluginControls &
  PluginLifecycleControls;

export type PluginLifecycle = PluginLifecycleControls['lifecycle'];

type CreateLifecycleOptions = {
  /** attaches whatever the plugin does while live. only ever called on a real transition */
  onEnable: () => void;
  /** tears down what `onEnable` attached. only ever called on a real transition */
  onDisable: () => void;
};

/**
 * builds the lifecycle controls every plugin exposes. starts disabled.
 *
 * suppression masks what `enable` and `disable` recorded rather than overwriting it, so
 * releasing hands the plugin back to the last caller's want rather than turning it on.
 */
export const createLifecycle = ({
  onEnable,
  onDisable,
}: CreateLifecycleOptions): PluginLifecycle => {
  const events = createEventHub(createLifecycleEventRegistry());
  const suppressions = new Map<symbol, string>();

  let wantsEnabled = false;
  let enabled = false;

  const reconcile = () => {
    const shouldBeEnabled = wantsEnabled && suppressions.size === 0;
    if (shouldBeEnabled === enabled) return;

    enabled = shouldBeEnabled;
    if (enabled) onEnable();
    else onDisable();

    events.emit(enabled ? 'onEnabled' : 'onDisabled');
  };

  const suppressedBy = () => [...suppressions.values()];

  const enable = () => {
    wantsEnabled = true;
    reconcile();
  };

  const disable = () => {
    wantsEnabled = false;
    reconcile();
  };

  const suppress = (reason: string) => {
    const token = Symbol(reason);
    suppressions.set(token, reason);
    reconcile();

    return () => {
      if (!suppressions.delete(token)) return;
      reconcile();
    };
  };

  return {
    enable,
    disable,
    isEnabled: () => enabled,
    suppress,
    suppressedBy,
    events,
  };
};
