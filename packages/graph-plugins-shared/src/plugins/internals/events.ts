import { GenericEventMap } from '@core/events/types';
import { ReadonlyGraphEventHub } from '@graph/primitives/events';

type PluginEventHub<EventMap extends GenericEventMap> = {
  /** events for plugin */
  events: ReadonlyGraphEventHub<EventMap>;
};

export type WithEvents<Controls, EventMap extends GenericEventMap> = Controls &
  PluginEventHub<EventMap>;
