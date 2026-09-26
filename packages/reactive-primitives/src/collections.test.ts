import { computed } from 'alien-signals';
import { describe, expect, it, vi } from 'vitest';

import { reactiveMap, reactiveSet } from './collections.ts';

/**
 * counts how many times the derivation actually ran, which is the only thing
 * worth asserting here. computeds are lazy, so every assertion reads the
 * computed to force evaluation before checking the count.
 */
const trackedComputed = <T>(derive: () => T) => {
  const runs = vi.fn();
  const value = computed(() => {
    runs();
    return derive();
  });
  return { value, runCount: () => runs.mock.calls.length };
};

describe('reactiveMap', () => {
  it('recomputes a dependent when a tracked key changes', () => {
    const map = reactiveMap<string, string>();
    const { value, runCount } = trackedComputed(() => map.get('a'));

    expect(value()).toBeUndefined();
    expect(runCount()).toBe(1);

    map.set('a', 'first');
    expect(value()).toBe('first');
    expect(runCount()).toBe(2);
  });

  it('memoizes: repeated reads without a mutation do not recompute', () => {
    const map = reactiveMap([['a', 'first']]);
    const { value, runCount } = trackedComputed(() => map.get('a'));

    value();
    value();
    value();
    expect(runCount()).toBe(1);
  });

  it('does not notify when set writes the value a key already holds', () => {
    const map = reactiveMap([['a', 'first']]);
    const { value, runCount } = trackedComputed(() => map.get('a'));

    value();
    map.set('a', 'first');
    value();

    expect(runCount()).toBe(1);
  });

  it('does not notify when delete misses or clear finds nothing', () => {
    const map = reactiveMap<string, string>();
    const { value, runCount } = trackedComputed(() => map.size);

    value();
    map.delete('absent');
    map.clear();
    value();

    expect(runCount()).toBe(1);
  });

  it('tracks size', () => {
    const map = reactiveMap<string, string>();
    const { value } = trackedComputed(() => map.size);

    expect(value()).toBe(0);
    map.set('a', 'first');
    expect(value()).toBe(1);
    map.delete('a');
    expect(value()).toBe(0);
  });

  it('tracks iteration, so Array.from sees later writes', () => {
    const map = reactiveMap<string, string>();
    const { value } = trackedComputed(() => Array.from(map));

    expect(value()).toEqual([]);
    map.set('a', 'first');
    expect(value()).toEqual([['a', 'first']]);
  });

  it('tracks has, keys, values, entries and forEach', () => {
    const map = reactiveMap<string, string>();
    const has = trackedComputed(() => map.has('a'));
    const keys = trackedComputed(() => [...map.keys()]);
    const values = trackedComputed(() => [...map.values()]);
    const entries = trackedComputed(() => [...map.entries()]);
    const forEach = trackedComputed(() => {
      const seen: string[] = [];
      map.forEach((v) => seen.push(v));
      return seen;
    });

    for (const derived of [has, keys, values, entries, forEach])
      derived.value();
    map.set('a', 'first');

    expect(has.value()).toBe(true);
    expect(keys.value()).toEqual(['a']);
    expect(values.value()).toEqual(['first']);
    expect(entries.value()).toEqual([['a', 'first']]);
    expect(forEach.value()).toEqual(['first']);
  });

  // Map's constructor calls this.set(), which runs before class fields are
  // initialized. seeding through super.set in the body is what keeps this from
  // throwing on a private field access.
  it('accepts seed entries without tripping field initialization order', () => {
    const map = reactiveMap([
      ['a', 'first'],
      ['b', 'second'],
    ]);

    expect(map.get('a')).toBe('first');
    expect(map.size).toBe(2);
  });

  it('is a real Map', () => {
    const map = reactiveMap<string, string>([['a', 'first']]);

    expect(map).toBeInstanceOf(Map);
    expect({ ...Object.fromEntries(map) }).toEqual({ a: 'first' });
    expect(Array.from(map.keys())).toEqual(['a']);
  });

  it('does not track when nothing is subscribed', () => {
    const map = reactiveMap<string, string>();

    expect(() => {
      map.get('a');
      map.set('a', 'first');
      void map.size;
    }).not.toThrow();
    expect(map.get('a')).toBe('first');
  });
});

describe('reactiveSet', () => {
  it('recomputes a dependent when membership changes', () => {
    const set = reactiveSet<string>();
    const { value, runCount } = trackedComputed(() => set.has('a'));

    expect(value()).toBe(false);
    set.add('a');
    expect(value()).toBe(true);
    expect(runCount()).toBe(2);
  });

  it('does not notify when adding a value already present', () => {
    const set = reactiveSet(['a']);
    const { value, runCount } = trackedComputed(() => set.has('a'));

    value();
    set.add('a');
    value();

    expect(runCount()).toBe(1);
  });

  it('tracks size and iteration', () => {
    const set = reactiveSet<string>();
    const size = trackedComputed(() => set.size);
    const items = trackedComputed(() => [...set]);

    expect(size.value()).toBe(0);
    expect(items.value()).toEqual([]);

    set.add('a');

    expect(size.value()).toBe(1);
    expect(items.value()).toEqual(['a']);
  });

  it('accepts seed values and is a real Set', () => {
    const set = reactiveSet(['a', 'b']);

    expect(set).toBeInstanceOf(Set);
    expect(set.size).toBe(2);
    expect([...set]).toEqual(['a', 'b']);
  });
});
