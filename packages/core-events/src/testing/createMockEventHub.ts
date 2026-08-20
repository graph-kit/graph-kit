import { MockInstance, vi } from 'vitest';

import { EventHub, createEventHub } from '../createEventHub.ts';
import { EventMapToEventRegistry, GenericEventMap } from '../types.ts';

export type MockEventHub<EventMap extends GenericEventMap> =
  EventHub<EventMap> & {
    emit: EventHub<EventMap>['emit'] & MockInstance;
  };

/**
 * Creates an EventHub with `emit` pre-spied so tests can assert on emitted events.
 *
 * @example
 * const hub = createMockEventHub(createNodePositionStoreEventRegistry());
 * hub.emit('onNodeMoveStreamStart');
 * expect(hub.emit).toHaveBeenCalledWith('onNodeMoveStreamStart');
 */
export const createMockEventHub = <EventMap extends GenericEventMap>(
  registry: EventMapToEventRegistry<EventMap>,
): MockEventHub<EventMap> => {
  const hub = createEventHub(registry);
  vi.spyOn(hub, 'emit');
  return hub as unknown as MockEventHub<EventMap>;
};
