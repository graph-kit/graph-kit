import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EventHub, createEventHub } from './createEventHub.ts';
import { EventMapToEventRegistry } from './types.ts';

type MockNode = { id: string };

type MockEventMap = {
  onNodesAdded: (nodes: MockNode[]) => void;
  onStructureChange: () => void;
};

type MockEventRegistry = EventMapToEventRegistry<MockEventMap>;

const createMockEventRegistry = (): MockEventRegistry => ({
  onNodesAdded: new Set(),
  onStructureChange: new Set(),
});

describe(createEventHub, () => {
  let registry: EventMapToEventRegistry<MockEventMap>;
  let hub: EventHub<MockEventMap>;

  beforeEach(() => {
    registry = createMockEventRegistry();
    hub = createEventHub(registry);
  });

  it('successfully registers a callback via subscribe', () => {
    const callback = vi.fn();
    hub.subscribe('onNodesAdded', callback);
    expect(registry.onNodesAdded.has(callback)).toBe(true);
    expect(registry.onNodesAdded.size).toBe(1);
  });

  it('safely unregisters a callback via unsubscribe', () => {
    const callback = vi.fn();
    hub.subscribe('onNodesAdded', callback);
    hub.unsubscribe('onNodesAdded', callback);
    expect(registry.onNodesAdded.has(callback)).toBe(false);
    expect(registry.onNodesAdded.size).toBe(0);
  });

  it('broadcasts to all subscribers with exact parameters when emit is invoked', () => {
    const subscriberA = vi.fn();
    const subscriberB = vi.fn();
    hub.subscribe('onNodesAdded', subscriberA);
    hub.subscribe('onNodesAdded', subscriberB);
    hub.emit('onNodesAdded', [{ id: '1' }]);
    expect(subscriberA).toHaveBeenCalledExactlyOnceWith([{ id: '1' }]);
    expect(subscriberB).toHaveBeenCalledExactlyOnceWith([{ id: '1' }]);
  });

  it('handles zero-argument event emissions cleanly', () => {
    const callback = vi.fn();
    hub.subscribe('onStructureChange', callback);
    hub.emit('onStructureChange');
    expect(callback).toHaveBeenCalledExactlyOnceWith();
  });

  it('does not throw or fail when emitting an event with no subscribers', () => {
    expect(() => hub.emit('onNodesAdded', [{ id: '1' }])).not.toThrow();
  });
});
