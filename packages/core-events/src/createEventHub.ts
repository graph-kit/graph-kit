import { createEventHandler } from './createEventHandler.ts';
import { EventMapToEventRegistry, GenericEventMap } from './types.ts';

/**
 * creates a `subscribe`, `unsubscribe`, and `emit` function for
 * registering, deregistering and broadcasting graph events.
 */
export const createEventHub = <EventMap extends GenericEventMap>(
  eventRegistry: EventMapToEventRegistry<EventMap>,
) => {
  const { handle, unhandle, fireHandlers } = createEventHandler<EventMap>();
  return {
    /**
     * subscribe to an event to receive updates when it is triggered
     *
     * @param eventName the name of the event to subscribe to
     * @param eventCallback the callback function invoked when the event is emitted
     * @example subscribe('onNodesAdded', (node) => console.log(node)) // logs the node that was added
     */
    subscribe: <EventName extends keyof EventMap>(
      eventName: EventName,
      eventCallback: EventMap[EventName],
    ) => {
      eventRegistry[eventName].add(eventCallback);
    },
    /**
     * handle an event, and call consume to prevent lower priority handlers from receiving the event
     *
     * @param eventName the name of the event to handle
     * @param eventCallback the callback function invoked when the event is emitted
     * @param consume prevents the event from being handled by other handlers downstream (ie stops propagation)
     * @example handle('onNodesAdded', (node, consume) => {
     *  console.log(node)
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
     * @example unsubscribe('onNodesAdded', someSubscribedCallback) // stops logging the node that was added
     */
    unsubscribe: <EventName extends keyof EventMap>(
      eventName: EventName,
      eventCallback: EventMap[EventName],
    ) => {
      eventRegistry[eventName].delete(eventCallback);
    },
    /**
     * clear a handler callback to stop handling updates when triggered
     *
     * @param eventName the name of the event to clear the handler from
     * @param eventCallback the callback function to be removed from the event
     * @example unhandle('onNodesAdded', someHandlerCallback) // stops logging the node that was added
     */
    unhandle,
    /**
     * push an event to all subscribers
     *
     * @param eventName the name of the event to push to
     * @param callbackArgs the arguments to be passed to the event's callbacks
     * @example emit('onNodesAdded', node) // invokes all callbacks subscribed or handling onNodesAdded, with the node as an argument
     */
    emit: <EventName extends keyof EventMap>(
      eventName: EventName,
      ...callbackArgs: Parameters<EventMap[EventName]>
    ) => {
      for (const callback of eventRegistry[eventName]) {
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
