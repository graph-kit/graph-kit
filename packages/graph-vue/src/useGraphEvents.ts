import { GenericEventMap } from '@core/events/types';
import { ConsumerEventsHub } from '@graph/core/consumer-events';
import { ReadonlyGraphEventHub } from '@graph/primitives/events';

import { onUnmounted } from 'vue';

// only subscribe/unsubscribe get wrapped — handle/unhandle are plugin-priority
// wiring keyed by GraphHandlerId, not per-component subscriptions, so there's nothing
// to tie to this component's lifetime.
const withAutoUnsubscribe = <EventMap extends GenericEventMap>(
  hub: ReadonlyGraphEventHub<EventMap>,
): ReadonlyGraphEventHub<EventMap> => ({
  ...hub,
  subscribe: (eventName, eventCallback) => {
    hub.subscribe(eventName, eventCallback);
    onUnmounted(() => hub.unsubscribe(eventName, eventCallback));
  },
});

/**
 * wraps graph.events so every subscribe made from within the calling component
 * unsubscribes automatically onUnmounted. shaped identically to ConsumerEventsHub,
 * so it's a drop-in replacement for the `events` field returned from useGraph.
 */
export const useGraphEvents = (
  events: ConsumerEventsHub,
): ConsumerEventsHub => ({
  ...withAutoUnsubscribe(events),
  transit: withAutoUnsubscribe(events.transit),
  _internal: {
    core: withAutoUnsubscribe(events._internal.core),
  },
});
