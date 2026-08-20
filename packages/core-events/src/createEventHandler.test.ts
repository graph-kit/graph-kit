import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createEventHandler } from './createEventHandler.ts';

type TestEventMap = {
  onClick: (x: number) => void;
  onHover: () => void;
};

type TestEventHandler = ReturnType<typeof createEventHandler<TestEventMap>>;

const TEST_HANDLER_ID = 'hub';

describe(createEventHandler, () => {
  let handle: TestEventHandler['handle'];
  let unhandle: TestEventHandler['unhandle'];
  let fireHandlers: TestEventHandler['fireHandlers'];

  beforeEach(() => {
    ({ handle, unhandle, fireHandlers } = createEventHandler<TestEventMap>());
  });

  describe('handle', () => {
    it('invokes a registered handler when fireHandlers is called', () => {
      const cb = vi.fn();
      handle('onClick', cb, TEST_HANDLER_ID);
      fireHandlers('onClick', 42);
      expect(cb).toHaveBeenCalledExactlyOnceWith(42, expect.any(Function));
    });

    it('does not invoke handlers for other events', () => {
      const cb = vi.fn();
      handle('onHover', cb, TEST_HANDLER_ID);
      fireHandlers('onClick', 1);
      expect(cb).not.toHaveBeenCalled();
    });

    it('invokes multiple handlers in priority order', () => {
      const order: string[] = [];
      handle('onClick', () => order.push('second'), 'second', {
        before: [],
      });
      handle('onClick', () => order.push('first'), 'first', {
        before: ['second'],
      });
      fireHandlers('onClick', 1);
      expect(order).toEqual(['first', 'second']);
    });
  });

  describe('unhandle', () => {
    it('removes a handler so it is no longer invoked', () => {
      const cb = vi.fn();
      handle('onClick', cb, TEST_HANDLER_ID);
      unhandle('onClick', cb);
      fireHandlers('onClick', 1);
      expect(cb).not.toHaveBeenCalled();
    });

    it('only removes the specified handler', () => {
      const cb1 = vi.fn();
      const cb2 = vi.fn();
      handle('onClick', cb1, TEST_HANDLER_ID);
      handle('onClick', cb2, TEST_HANDLER_ID);
      unhandle('onClick', cb1);
      fireHandlers('onClick', 1);
      expect(cb1).not.toHaveBeenCalled();
      expect(cb2).toHaveBeenCalledOnce();
    });

    it('is a no-op when the event has no handlers', () => {
      expect(() => unhandle('onClick', vi.fn())).not.toThrow();
    });
  });

  describe('fireHandlers', () => {
    it('stops calling handlers after consume is called', () => {
      const a = vi.fn((_x: number, consume: () => void) => consume());
      const b = vi.fn();
      handle('onClick', b, 'second');
      handle('onClick', a, 'first', {
        before: ['second'],
      });
      fireHandlers('onClick', 0);
      expect(a).toHaveBeenCalledOnce();
      expect(b).not.toHaveBeenCalled();
    });

    it('is a no-op when no handlers are registered for the event', () => {
      expect(() => fireHandlers('onClick', 1)).not.toThrow();
    });
  });
});
