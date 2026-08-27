import { createMockEventHub } from '@core/events/testing/createMockEventHub';
import { describe, expect, it } from 'vitest';

import { DEFAULT_POSITION } from './constants.ts';
import { createNodePositionStore } from './createNodePositionStore.ts';
import { createNodePositionStoreEventRegistry } from './events.ts';

const makeStore = () => {
  const hub = createMockEventHub(createNodePositionStoreEventRegistry());
  const store = createNodePositionStore(hub);
  return { store, hub };
};

describe(createNodePositionStore, () => {
  describe('_internal.add', () => {
    it('registers nodes with default position values', () => {
      const { store } = makeStore();
      store._internal.add([{ id: 'a' }]);
      expect(store.get('a')).toEqual(DEFAULT_POSITION);
    });

    it('registers nodes with partial position overrides', () => {
      const { store } = makeStore();
      store._internal.add([{ id: 'a', position: { x: 10, y: 20 } }]);
      expect(store.get('a')).toEqual({ ...DEFAULT_POSITION, x: 10, y: 20 });
    });

    it('registers multiple nodes independently', () => {
      const { store } = makeStore();
      store._internal.add([
        { id: 'a', position: { x: 1 } },
        { id: 'b', position: { x: 2 } },
      ]);
      expect(store.get('a').x).toBe(1);
      expect(store.get('b').x).toBe(2);
    });
  });

  describe('_internal.remove', () => {
    it('removes a node from the store', () => {
      const { store } = makeStore();
      store._internal.add([{ id: 'a' }]);
      store._internal.remove(['a']);
      expect(() => store.get('a')).toThrow();
    });

    it('silently ignores ids that do not exist', () => {
      const { store } = makeStore();
      expect(() => store._internal.remove(['nonexistent'])).not.toThrow();
    });
  });

  describe('get', () => {
    it('throws when node id is not found', () => {
      const { store } = makeStore();
      expect(() => store.get('missing')).toThrow();
    });
  });

  describe('presented', () => {
    it('reads through to the committed position when nothing is overridden', () => {
      const { store } = makeStore();
      store._internal.add([{ id: 'a', position: { x: 10, y: 20 } }]);
      expect(store.presented.get('a')).toEqual(store.get('a'));
      expect(store.presented.has('a')).toBe(false);
    });

    it('returns the override once one is installed', () => {
      const { store } = makeStore();
      store._internal.add([{ id: 'a', position: { x: 10, y: 20 } }]);

      store.presented.set('a', { x: 99 });

      expect(store.presented.get('a')).toEqual({
        ...DEFAULT_POSITION,
        x: 99,
        y: 20,
      });
      expect(store.presented.has('a')).toBe(true);
    });

    it('leaves the committed position untouched while overridden', () => {
      const { store, hub } = makeStore();
      store._internal.add([{ id: 'a', position: { x: 10, y: 20 } }]);

      store.presented.set('a', { x: 99, y: 99 });

      expect(store.get('a')).toEqual({ ...DEFAULT_POSITION, x: 10, y: 20 });
      expect(hub.emit).not.toHaveBeenCalled();
    });

    it('composes successive partial writes', () => {
      const { store } = makeStore();
      store._internal.add([{ id: 'a' }]);

      store.presented.set('a', { x: 5 });
      store.presented.set('a', { y: 7 });

      expect(store.presented.get('a')).toEqual({
        ...DEFAULT_POSITION,
        x: 5,
        y: 7,
      });
    });

    it('falls back to the committed position after clearing', () => {
      const { store } = makeStore();
      store._internal.add([{ id: 'a', position: { x: 10 } }]);
      store.presented.set('a', { x: 99 });

      store.presented.clear('a');

      expect(store.presented.get('a')).toEqual({ ...DEFAULT_POSITION, x: 10 });
      expect(store.presented.has('a')).toBe(false);
    });

    it('picks up committed moves that happened while overridden, once cleared', () => {
      const { store } = makeStore();
      store._internal.add([{ id: 'a', position: { x: 10 } }]);
      store.presented.set('a', { x: 99 });

      store.set({ nodeId: 'a', update: { x: 50 } });

      expect(store.presented.get('a').x).toBe(99);
      store.presented.clear('a');
      expect(store.presented.get('a').x).toBe(50);
    });

    it('drops overrides for nodes that leave the graph', () => {
      const { store } = makeStore();
      store._internal.add([{ id: 'a' }]);
      store.presented.set('a', { x: 99 });

      store._internal.remove(['a']);

      expect(store.presented.has('a')).toBe(false);
      expect(() => store.presented.get('a')).toThrow();
    });

    it('clearAll releases every override at once', () => {
      const { store } = makeStore();
      store._internal.add([{ id: 'a' }, { id: 'b' }]);
      store.presented.set('a', { x: 1 });
      store.presented.set('b', { x: 2 });

      store.presented.clearAll();

      expect(store.presented.has('a')).toBe(false);
      expect(store.presented.has('b')).toBe(false);
    });
  });

  describe('set', () => {
    it('updates the position of a node', () => {
      const { store } = makeStore();
      store._internal.add([{ id: 'a' }]);
      store.set({ nodeId: 'a', update: { x: 99, y: 88 } });
      expect(store.get('a')).toMatchObject({ x: 99, y: 88 });
    });

    it('correctly sets x, y, and z to 0', () => {
      const { store } = makeStore();
      store._internal.add([{ id: 'a', position: { x: 5, y: 5, z: 5 } }]);
      store.set({ nodeId: 'a', update: { x: 0, y: 0, z: 0 } });
      expect(store.get('a')).toMatchObject({ x: 0, y: 0, z: 0 });
    });

    it('accepts a getter function for the update', () => {
      const { store } = makeStore();
      store._internal.add([{ id: 'a', position: { x: 5 } }]);
      store.set({ nodeId: 'a', update: (current) => ({ x: current.x + 10 }) });
      expect(store.get('a').x).toBe(15);
    });

    it('emits onNodePositionsCommitted with the updated entry', () => {
      const { store, hub } = makeStore();
      store._internal.add([{ id: 'a' }]);
      store.set({ nodeId: 'a', update: { x: 5 } });
      expect(hub.emit).toHaveBeenCalledWith('onNodePositionsCommitted', [
        { nodeId: 'a', position: expect.objectContaining({ x: 5 }) },
      ]);
    });

    it('returns a snapshot so subsequent mutations do not affect the emitted entry', () => {
      const { store, hub } = makeStore();
      store._internal.add([{ id: 'a', position: { x: 1 } }]);
      store.set({ nodeId: 'a', update: { x: 5 } });
      const [[, committed]] = hub.emit.mock.calls.filter(
        (args: unknown[]) => args[0] === 'onNodePositionsCommitted',
      );
      store.set({ nodeId: 'a', update: { x: 99 } });
      expect(committed[0].position.x).toBe(5);
    });
  });

  describe('setMany', () => {
    it('updates multiple nodes in one call', () => {
      const { store } = makeStore();
      store._internal.add([{ id: 'a' }, { id: 'b' }]);
      store.setMany([
        { nodeId: 'a', update: { x: 1 } },
        { nodeId: 'b', update: { x: 2 } },
      ]);
      expect(store.get('a').x).toBe(1);
      expect(store.get('b').x).toBe(2);
    });

    it('emits onNodePositionsCommitted once with all entries', () => {
      const { store, hub } = makeStore();
      store._internal.add([{ id: 'a' }, { id: 'b' }]);
      store.setMany([
        { nodeId: 'a', update: { x: 1 } },
        { nodeId: 'b', update: { x: 2 } },
      ]);
      const committed = hub.emit.mock.calls.filter(
        (args: unknown[]) => args[0] === 'onNodePositionsCommitted',
      );
      expect(committed).toHaveLength(1);
      expect(committed[0][1]).toHaveLength(2);
    });
  });

  describe('createStream', () => {
    it('emits onNodeMoveStreamStart when a stream is created', () => {
      const { store, hub } = makeStore();
      store._internal.add([{ id: 'a' }]);
      store.createStream();
      expect(hub.emit).toHaveBeenCalledWith('onNodeMoveStreamStart');
    });

    it('allows creating a new stream after stop()', () => {
      const { store } = makeStore();
      store._internal.add([{ id: 'a' }]);
      const stream = store.createStream();
      stream.stop();
      expect(() => store.createStream()).not.toThrow();
    });

    describe('overlapping streams', () => {
      it('opens a second stream while the first is still running', () => {
        const { store } = makeStore();
        store._internal.add([{ id: 'a' }]);
        store.createStream();
        expect(() => store.createStream()).not.toThrow();
      });

      it('commits only the nodes its own stream touched', () => {
        const { store, hub } = makeStore();
        store._internal.add([{ id: 'a' }, { id: 'b' }]);

        const first = store.createStream();
        const second = store.createStream();
        first.set({ nodeId: 'a', update: { x: 1 } });
        second.set({ nodeId: 'b', update: { x: 2 } });

        expect(first.stop()).toEqual([
          { nodeId: 'a', position: expect.objectContaining({ x: 1 }) },
        ]);
        expect(second.stop()).toEqual([
          { nodeId: 'b', position: expect.objectContaining({ x: 2 }) },
        ]);

        const committed = hub.emit.mock.calls.filter(
          (args: unknown[]) => args[0] === 'onNodePositionsCommitted',
        );
        expect(committed).toHaveLength(2);
      });

      it('leaves the other stream usable after one stops', () => {
        const { store } = makeStore();
        store._internal.add([{ id: 'a' }]);

        const first = store.createStream();
        const second = store.createStream();
        first.stop();

        second.set({ nodeId: 'a', update: { x: 7 } });
        expect(store.presented.get('a').x).toBe(7);
        expect(second.stop()).toHaveLength(1);
        expect(store.get('a').x).toBe(7);
      });

      it('takes over a node that was already overridden, and commits its own value', () => {
        const { store } = makeStore();
        store._internal.add([{ id: 'a' }]);
        store.presented.set('a', { x: 100 });

        const stream = store.createStream();
        stream.set({ nodeId: 'a', update: { x: 7 } });

        expect(store.presented.get('a').x).toBe(7);
        expect(stream.stop()).toEqual([
          { nodeId: 'a', position: expect.objectContaining({ x: 7 }) },
        ]);
        expect(store.get('a').x).toBe(7);
        expect(store.presented.has('a')).toBe(false);
      });

      // a position arriving from elsewhere is a legitimate concurrent write, not a
      // caller mistake, so it lands rather than throwing
      it('accepts a direct write while a stream is running', () => {
        const { store } = makeStore();
        store._internal.add([{ id: 'a' }, { id: 'b' }]);

        const stream = store.createStream();
        stream.set({ nodeId: 'a', update: { x: 1 } });

        expect(() =>
          store.setMany([{ nodeId: 'b', update: { x: 9 } }]),
        ).not.toThrow();
        expect(store.get('b').x).toBe(9);

        // the direct write was never part of this stream, so it stays out of the commit
        expect(stream.stop()).toEqual([
          { nodeId: 'a', position: expect.objectContaining({ x: 1 }) },
        ]);
      });
    });

    describe('stream.set', () => {
      it('moves the presented position and leaves the committed one alone', () => {
        const { store } = makeStore();
        store._internal.add([{ id: 'a' }]);
        const stream = store.createStream();

        stream.set({ nodeId: 'a', update: { x: 42 } });

        expect(store.presented.get('a').x).toBe(42);
        expect(store.get('a').x).toBe(DEFAULT_POSITION.x);
      });

      it('commits the presented position and releases the override on stop', () => {
        const { store } = makeStore();
        store._internal.add([{ id: 'a' }]);
        const stream = store.createStream();
        stream.set({ nodeId: 'a', update: { x: 42 } });

        stream.stop();

        expect(store.get('a').x).toBe(42);
        expect(store.presented.has('a')).toBe(false);
      });

      it('emits onNodeMoveStream with updated entries', () => {
        const { store, hub } = makeStore();
        store._internal.add([{ id: 'a' }]);
        const stream = store.createStream();
        stream.set({ nodeId: 'a', update: { x: 42 } });
        expect(hub.emit).toHaveBeenCalledWith('onNodeMoveStream', [
          { nodeId: 'a', position: expect.objectContaining({ x: 42 }) },
        ]);
      });
    });

    describe('stream.setMany', () => {
      it('updates multiple nodes', () => {
        const { store } = makeStore();
        store._internal.add([{ id: 'a' }, { id: 'b' }]);
        const stream = store.createStream();
        stream.setMany([
          { nodeId: 'a', update: { x: 1 } },
          { nodeId: 'b', update: { x: 2 } },
        ]);

        expect(store.presented.get('a').x).toBe(1);
        expect(store.presented.get('b').x).toBe(2);

        stream.stop();

        expect(store.get('a').x).toBe(1);
        expect(store.get('b').x).toBe(2);
        expect(store.presented.has('a')).toBe(false);
        expect(store.presented.has('b')).toBe(false);
      });
    });

    describe('stream.stop', () => {
      it('emits onNodePositionsCommitted only for nodes touched during the stream', () => {
        const { store, hub } = makeStore();
        store._internal.add([{ id: 'a' }, { id: 'b' }]);
        const stream = store.createStream();
        stream.set({ nodeId: 'a', update: { x: 5 } });
        stream.stop();
        const committed = hub.emit.mock.calls.filter(
          (args: unknown[]) => args[0] === 'onNodePositionsCommitted',
        );
        expect(committed).toHaveLength(1);
        expect(committed[0][1]).toHaveLength(1);
        expect(committed[0][1][0].nodeId).toBe('a');
      });

      // a press that never moves opens and closes a stream, and a commit of nothing
      // would make every subscriber guard against an empty list
      it('does not emit onNodePositionsCommitted when nothing was touched', () => {
        const { store, hub } = makeStore();
        store._internal.add([{ id: 'a' }]);
        const stream = store.createStream();
        stream.stop();
        expect(hub.emit).not.toHaveBeenCalledWith(
          'onNodePositionsCommitted',
          expect.anything(),
        );
      });

      it('emits onNodeMoveStreamEnd', () => {
        const { store, hub } = makeStore();
        store._internal.add([{ id: 'a' }]);
        const stream = store.createStream();
        stream.stop();
        expect(hub.emit).toHaveBeenCalledWith('onNodeMoveStreamEnd');
      });

      it('is idempotent — calling stop() twice does not emit twice', () => {
        const { store, hub } = makeStore();
        store._internal.add([{ id: 'a' }]);
        const stream = store.createStream();
        stream.stop();
        stream.stop();
        const ends = hub.emit.mock.calls.filter(
          (args: unknown[]) => args[0] === 'onNodeMoveStreamEnd',
        );
        expect(ends).toHaveLength(1);
      });
    });

    describe('a node that leaves the graph mid stream', () => {
      it('commits only what is still here, rather than throwing', () => {
        const { store } = makeStore();
        store._internal.add([{ id: 'a' }, { id: 'b' }]);
        const stream = store.createStream();
        stream.setMany([
          { nodeId: 'a', update: { x: 1 } },
          { nodeId: 'b', update: { x: 2 } },
        ]);

        store._internal.remove(['b']);

        expect(stream.stop()).toEqual([
          { nodeId: 'a', position: { ...DEFAULT_POSITION, x: 1 } },
        ]);
      });

      it('skips it on a later write', () => {
        const { store } = makeStore();
        store._internal.add([{ id: 'a' }]);
        const stream = store.createStream();

        store._internal.remove(['a']);

        expect(
          stream.setMany([
            { nodeId: 'a', update: { x: 1 } },
            { nodeId: 'gone', update: { x: 2 } },
          ]),
        ).toEqual([]);
      });
    });
  });

  describe('setMany with a node that is no longer in the graph', () => {
    it('moves the rest rather than throwing', () => {
      const { store } = makeStore();
      store._internal.add([{ id: 'a' }]);

      expect(
        store.setMany([
          { nodeId: 'a', update: { x: 1 } },
          { nodeId: 'gone', update: { x: 2 } },
        ]),
      ).toEqual([{ nodeId: 'a', position: { ...DEFAULT_POSITION, x: 1 } }]);
    });
  });
});
