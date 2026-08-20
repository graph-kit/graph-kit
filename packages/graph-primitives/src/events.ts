import type { EventHub, ReadonlyEventHub } from '@core/events/createEventHub';
import { eventHubFor } from '@core/events/eventHubFor';
import type { GenericEventMap } from '@core/events/types';

/** every handler the first party graph system registers */
export type GraphHandlerId =
  | 'plugins/canvas'
  | 'plugins/anchors'
  | 'plugins/node-drag'
  | 'plugins/history'
  | 'plugins/marquee'
  | 'plugins/focus'
  | 'plugins/annotations'
  | 'plugins/interactive';

export const createGraphEventHub = eventHubFor<GraphHandlerId>();

export type GraphEventHub<EventMap extends GenericEventMap> = EventHub<
  EventMap,
  GraphHandlerId
>;

export type ReadonlyGraphEventHub<EventMap extends GenericEventMap> =
  ReadonlyEventHub<EventMap, GraphHandlerId>;
