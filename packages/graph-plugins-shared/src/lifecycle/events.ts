import { EventMapToEventRegistry } from '@core/events/types';

export type LifecycleEventMap = {
  /** the plugin became enabled */
  onEnabled: () => void;
  /** the plugin became disabled */
  onDisabled: () => void;
};

export const createLifecycleEventRegistry =
  (): EventMapToEventRegistry<LifecycleEventMap> => ({
    onEnabled: new Set(),
    onDisabled: new Set(),
  });
