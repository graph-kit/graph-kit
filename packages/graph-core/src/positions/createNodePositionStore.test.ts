import { createMockEventHub } from '@graph/primitives/testing/events/createMockEventHub';
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

  describe('active stream guard', () => {
    it('throws when set() is called while a stream is active', () => {
      const { store } = makeStore();
      store._internal.add([{ id: 'a' }]);
      store.createStream();
      expect(() => store.set({ nodeId: 'a', update: { x: 1 } })).toThrow();
    });

    it('throws when setMany() is called while a stream is active', () => {
      const { store } = makeStore();
      store._internal.add([{ id: 'a' }]);
      store.createStream();
      expect(() =>
        store.setMany([{ nodeId: 'a', update: { x: 1 } }]),
      ).toThrow();
    });

    it('allows set() again after the stream is stopped', () => {
      const { store } = makeStore();
      store._internal.add([{ id: 'a' }]);
      const stream = store.createStream();
      stream.stop();
      expect(() => store.set({ nodeId: 'a', update: { x: 1 } })).not.toThrow();
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

    it('throws when a second stream is created before stop()', () => {
      const { store } = makeStore();
      store._internal.add([{ id: 'a' }]);
      store.createStream();
      expect(() => store.createStream()).toThrow();
    });

    it('allows creating a new stream after stop()', () => {
      const { store } = makeStore();
      store._internal.add([{ id: 'a' }]);
      const stream = store.createStream();
      stream.stop();
      expect(() => store.createStream()).not.toThrow();
    });

    describe('stream.set', () => {
      it('updates the node position', () => {
        const { store } = makeStore();
        store._internal.add([{ id: 'a' }]);
        const stream = store.createStream();
        stream.set({ nodeId: 'a', update: { x: 42 } });
        expect(store.get('a').x).toBe(42);
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
        expect(store.get('a').x).toBe(1);
        expect(store.get('b').x).toBe(2);
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
  });
});
