import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EventHub, createEventHub } from './createEventHub.ts';
import { EventMapToEventRegistry } from './types.ts';

type MockItem = { id: string };

type MockEventMap = {
  onItemsAdded: (items: MockItem[]) => void;
  onChange: () => void;
};

type MockEventRegistry = EventMapToEventRegistry<MockEventMap>;

const createMockEventRegistry = (): MockEventRegistry => ({
  onItemsAdded: new Set(),
  onChange: new Set(),
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
    hub.subscribe('onItemsAdded', callback);
    expect(registry.onItemsAdded.has(callback)).toBe(true);
    expect(registry.onItemsAdded.size).toBe(1);
  });

  it('safely unregisters a callback via unsubscribe', () => {
    const callback = vi.fn();
    hub.subscribe('onItemsAdded', callback);
    hub.unsubscribe('onItemsAdded', callback);
    expect(registry.onItemsAdded.has(callback)).toBe(false);
    expect(registry.onItemsAdded.size).toBe(0);
  });

  it('unregisters a callback via the cleanup returned by subscribe', () => {
    const callback = vi.fn();
    const cleanup = hub.subscribe('onItemsAdded', callback);
    cleanup();
    hub.emit('onItemsAdded', [{ id: '1' }]);
    expect(callback).not.toHaveBeenCalled();
    expect(registry.onItemsAdded.size).toBe(0);
  });

  it('broadcasts to all subscribers with exact parameters when emit is invoked', () => {
    const subscriberA = vi.fn();
    const subscriberB = vi.fn();
    hub.subscribe('onItemsAdded', subscriberA);
    hub.subscribe('onItemsAdded', subscriberB);
    hub.emit('onItemsAdded', [{ id: '1' }]);
    expect(subscriberA).toHaveBeenCalledExactlyOnceWith([{ id: '1' }]);
    expect(subscriberB).toHaveBeenCalledExactlyOnceWith([{ id: '1' }]);
  });

  it('handles zero-argument event emissions cleanly', () => {
    const callback = vi.fn();
    hub.subscribe('onChange', callback);
    hub.emit('onChange');
    expect(callback).toHaveBeenCalledExactlyOnceWith();
  });

  it('does not throw or fail when emitting an event with no subscribers', () => {
    expect(() => hub.emit('onItemsAdded', [{ id: '1' }])).not.toThrow();
  });

  it('invokes a subscriber once when it resubscribes itself mid-emit', () => {
    let calls = 0;
    const RUNAWAY = 50;
    const subscriber = () => {
      calls++;
      if (calls > RUNAWAY) throw new Error('subscriber re-entered itself');
      hub.unsubscribe('onChange', subscriber);
      hub.subscribe('onChange', subscriber);
    };
    hub.subscribe('onChange', subscriber);
    hub.emit('onChange');
    expect(calls).toBe(1);
  });

  it('does not invoke a subscriber another subscriber unsubscribed mid-emit', () => {
    const second = vi.fn();
    hub.subscribe('onChange', () => hub.unsubscribe('onChange', second));
    hub.subscribe('onChange', second);
    hub.emit('onChange');
    expect(second).not.toHaveBeenCalled();
  });

  it('invokes a handler once when the same callback is handled twice', () => {
    const handler = vi.fn();
    hub.handle('onChange', handler, 'hub');
    hub.handle('onChange', handler, 'hub');
    hub.emit('onChange');
    expect(handler).toHaveBeenCalledOnce();
  });
});
