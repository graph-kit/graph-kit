import { createEventHandler } from './createEventHandler.ts';
import { EventMapToEventRegistry, GenericEventMap } from './types.ts';

/**
 * creates a `subscribe`, `unsubscribe`, and `emit` function for
 * registering, deregistering and broadcasting events.
 */
export const createEventHub = <EventMap extends GenericEventMap>(
  eventRegistry: EventMapToEventRegistry<EventMap>,
) => {
  const { handle, unhandle, fireHandlers } = createEventHandler<EventMap>();

  const unsubscribe = <EventName extends keyof EventMap>(
    eventName: EventName,
    eventCallback: EventMap[EventName],
  ) => {
    eventRegistry[eventName].delete(eventCallback);
  };

  return {
    /**
     * subscribe to an event to receive updates when it is triggered
     *
     * @param eventName the name of the event to subscribe to
     * @param eventCallback the callback function invoked when the event is emitted
     * @returns a cleanup function that unsubscribes the callback. subscriptions
     * are deduped by callback, so cleanup removes the callback for every caller
     * that subscribed it
     * @example
     * const cleanup = subscribe('onItemsAdded', (items) => console.log(items)) // logs the items that were added
     * cleanup() // stops logging
     */
    subscribe: <EventName extends keyof EventMap>(
      eventName: EventName,
      eventCallback: EventMap[EventName],
    ) => {
      eventRegistry[eventName].add(eventCallback);
      return () => unsubscribe(eventName, eventCallback);
    },
    /**
     * handle an event, and call consume to prevent lower priority handlers from receiving the event
     *
     * @param eventName the name of the event to handle
     * @param eventCallback the callback function invoked when the event is emitted
     * @param consume prevents the event from being handled by other handlers downstream (ie stops propagation)
     * @returns a cleanup function that removes the handler. handlers are
     * deduped by callback, so cleanup removes the callback for every caller
     * that registered it
     * @example handle('onItemsAdded', (items, consume) => {
     *  console.log(items)
     *  // we handled the event 😎
     *  consume()
     * })
     */
    handle,
    /**
     * unsubscribe from an event to stop receiving updates when it is triggered
     *
     * @param eventName the name of the event to unsubscribe from
     * @param eventCallback the callback function to be removed from the event
     * @example unsubscribe('onItemsAdded', someSubscribedCallback) // stops logging the items that were added
     */
    unsubscribe,
    /**
     * clear a handler callback to stop handling updates when triggered
     *
     * @param eventName the name of the event to clear the handler from
     * @param eventCallback the callback function to be removed from the event
     * @example unhandle('onItemsAdded', someHandlerCallback) // stops logging the items that were added
     */
    unhandle,
    /**
     * push an event to all subscribers
     *
     * @param eventName the name of the event to push to
     * @param callbackArgs the arguments to be passed to the event's callbacks
     * @example emit('onItemsAdded', items) // invokes all callbacks subscribed or handling onItemsAdded, with the items as an argument
     */
    emit: <EventName extends keyof EventMap>(
      eventName: EventName,
      ...callbackArgs: Parameters<EventMap[EventName]>
    ) => {
      // the copy stops a subscriber that resubscribes itself from being reached twice,
      // the membership check keeps one that unsubscribes mid emit from being called
      const subscribers = eventRegistry[eventName];
      for (const callback of [...subscribers]) {
        if (!subscribers.has(callback)) continue;
        callback(...callbackArgs);
      }
      fireHandlers(eventName, ...callbackArgs);
    },
  };
};

export type EventHub<EventMap extends GenericEventMap> = ReturnType<
  typeof createEventHub<EventMap>
>;

export type ReadonlyEventHub<EventMap extends GenericEventMap> = Omit<
  EventHub<EventMap>,
  'emit'
>;
