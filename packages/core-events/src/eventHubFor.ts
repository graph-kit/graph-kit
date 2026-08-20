import { createEventHub } from './createEventHub.ts';
import { EventMapToEventRegistry, GenericEventMap } from './types.ts';

/**
 * binds a hub to a closed set of handler ids. a separate import from
 * {@link createEventHub} because a system that names its handlers is the exception:
 * everywhere else takes any string and reaches for `createEventHub` directly.
 *
 * @example export const createGraphEventHub = eventHubFor<GraphHandlerId>()
 */
export const eventHubFor =
  <HandlerId extends string>() =>
  <EventMap extends GenericEventMap>(
    eventRegistry: EventMapToEventRegistry<EventMap>,
  ) =>
    createEventHub<EventMap, HandlerId>(eventRegistry);
