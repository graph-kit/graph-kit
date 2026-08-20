import { ReadonlyEventHub } from '@core/events/createEventHub';
import { GenericEventMap } from '@core/events/types';

type PluginEventHub<EventMap extends GenericEventMap> = {
  /** events for plugin */
  events: ReadonlyEventHub<EventMap>;
};

export type WithEvents<Controls, EventMap extends GenericEventMap> = Controls &
  PluginEventHub<EventMap>;
