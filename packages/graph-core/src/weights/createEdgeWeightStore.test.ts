import { createMockEventHub } from '@core/events/testing/createMockEventHub';
import Fraction from 'fraction.js';
import { describe, expect, it } from 'vitest';

import { createCoreEventRegistry } from '../events.ts';
import { DEFAULT_WEIGHT } from './constants.ts';
import { createEdgeWeightStore } from './createEdgeWeightStore.ts';

const makeStore = (weighted = true) => {
  const hub = createMockEventHub(createCoreEventRegistry());
  const options = { weighted } as any;
  const store = createEdgeWeightStore(hub, options);
  return { store, hub };
};

describe(createEdgeWeightStore, () => {
  describe('_internal.add', () => {
    it('registers edges with the default weight', () => {
      const { store } = makeStore();
      store._internal.add([{ id: 'e1' }]);
      expect(store.get('e1').equals(DEFAULT_WEIGHT)).toBe(true);
    });

    it('registers edges with a provided weight', () => {
      const { store } = makeStore();
      const w = new Fraction(7);
      store._internal.add([{ id: 'e1', weight: w }]);
      expect(store.get('e1').equals(w)).toBe(true);
    });

    it('registers multiple edges independently', () => {
      const { store } = makeStore();
      store._internal.add([
        { id: 'e1', weight: new Fraction(3) },
        { id: 'e2', weight: new Fraction(5) },
      ]);
      expect(store.get('e1').equals(new Fraction(3))).toBe(true);
      expect(store.get('e2').equals(new Fraction(5))).toBe(true);
    });
  });

  describe('_internal.remove', () => {
    it('removes an edge from the store', () => {
      const { store } = makeStore();
      store._internal.add([{ id: 'e1' }]);
      store._internal.remove(['e1']);
      expect(() => store.get('e1')).toThrow();
    });

    it('silently ignores ids that do not exist', () => {
      const { store } = makeStore();
      expect(() => store._internal.remove(['nonexistent'])).not.toThrow();
    });
  });

  describe('get', () => {
    it('throws when the edge id is not found', () => {
      const { store } = makeStore();
      expect(() => store.get('missing')).toThrow();
    });

    it('returns weight 1 when the graph is unweighted, regardless of stored weight', () => {
      const { store } = makeStore(false);
      store._internal.add([{ id: 'e1', weight: new Fraction(42) }]);
      expect(store.get('e1').equals(new Fraction(1))).toBe(true);
    });

    it('returns the stored weight when the graph is weighted', () => {
      const { store } = makeStore(true);
      store._internal.add([{ id: 'e1', weight: new Fraction(42) }]);
      expect(store.get('e1').equals(new Fraction(42))).toBe(true);
    });
  });

  describe('set', () => {
    it('updates the weight of an edge', () => {
      const { store } = makeStore();
      store._internal.add([{ id: 'e1' }]);
      store.set({ edgeId: 'e1', update: new Fraction(9) });
      expect(store.get('e1').equals(new Fraction(9))).toBe(true);
    });

    it('accepts a getter function for the update', () => {
      const { store } = makeStore();
      store._internal.add([{ id: 'e1', weight: new Fraction(3) }]);
      store.set({ edgeId: 'e1', update: (current) => current.add(2) });
      expect(store.get('e1').equals(new Fraction(5))).toBe(true);
    });

    it('triggers onEdgeWeightsCommitted with the updated entry', () => {
      const { store, hub } = makeStore();
      store._internal.add([{ id: 'e1' }]);
      store.set({ edgeId: 'e1', update: new Fraction(4) });
      const [[, entries]] = hub.emit.mock.calls.filter(
        (args: unknown[]) => args[0] === 'onEdgeWeightsCommitted',
      );
      expect(entries[0].edgeId).toBe('e1');
      expect((entries[0].weight as Fraction).equals(new Fraction(4))).toBe(
        true,
      );
    });

    it('returns the committed entry', () => {
      const { store } = makeStore();
      store._internal.add([{ id: 'e1' }]);
      const entry = store.set({ edgeId: 'e1', update: new Fraction(6) });
      expect(entry.edgeId).toBe('e1');
      expect(entry.weight.equals(new Fraction(6))).toBe(true);
    });
  });

  describe('setMany', () => {
    it('updates multiple edges in one call', () => {
      const { store } = makeStore();
      store._internal.add([{ id: 'e1' }, { id: 'e2' }]);
      store.setMany([
        { edgeId: 'e1', update: new Fraction(2) },
        { edgeId: 'e2', update: new Fraction(3) },
      ]);
      expect(store.get('e1').equals(new Fraction(2))).toBe(true);
      expect(store.get('e2').equals(new Fraction(3))).toBe(true);
    });

    it('triggers onEdgeWeightsCommitted once with all entries', () => {
      const { store, hub } = makeStore();
      store._internal.add([{ id: 'e1' }, { id: 'e2' }]);
      store.setMany([
        { edgeId: 'e1', update: new Fraction(2) },
        { edgeId: 'e2', update: new Fraction(3) },
      ]);
      const committed = hub.emit.mock.calls.filter(
        (args: unknown[]) => args[0] === 'onEdgeWeightsCommitted',
      );
      expect(committed).toHaveLength(1);
      expect(committed[0][1]).toHaveLength(2);
    });
  });
});
