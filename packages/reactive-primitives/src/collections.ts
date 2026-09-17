import { signal } from 'alien-signals';

const createVersion = () => {
  const version = signal(0);
  let revision = 0;

  return {
    track: () => version(),
    bump: () => version(++revision),
  };
};

export class ReactiveMap<K, V> extends Map<K, V> {
  #version = createVersion();

  constructor(entries?: readonly (readonly [K, V])[] | null) {
    // seeded here rather than through super(entries): Map's constructor calls
    // this.set(), which runs before #version is initialized
    super();
    if (entries) {
      for (const [key, value] of entries) super.set(key, value);
    }
  }

  get size(): number {
    this.#version.track();
    return super.size;
  }

  get(key: K): V | undefined {
    this.#version.track();
    return super.get(key);
  }

  has(key: K): boolean {
    this.#version.track();
    return super.has(key);
  }

  set(key: K, value: V): this {
    const unchanged = super.has(key) && Object.is(super.get(key), value);
    super.set(key, value);
    if (!unchanged) this.#version.bump();
    return this;
  }

  delete(key: K): boolean {
    const deleted = super.delete(key);
    if (deleted) this.#version.bump();
    return deleted;
  }

  clear(): void {
    const hadEntries = super.size > 0;
    super.clear();
    if (hadEntries) this.#version.bump();
  }

  forEach(
    callback: (value: V, key: K, map: Map<K, V>) => void,
    thisArg?: unknown,
  ): void {
    this.#version.track();
    super.forEach(callback, thisArg);
  }

  keys(): MapIterator<K> {
    this.#version.track();
    return super.keys();
  }

  values(): MapIterator<V> {
    this.#version.track();
    return super.values();
  }

  entries(): MapIterator<[K, V]> {
    this.#version.track();
    return super.entries();
  }

  [Symbol.iterator](): MapIterator<[K, V]> {
    this.#version.track();
    return super[Symbol.iterator]();
  }
}

// TODO before stable: the ES2025 set methods (union, intersection, difference,
// symmetricDifference, isSubsetOf, isSupersetOf, isDisjointFrom) read through
// internal slots and are not tracked here. unreachable while lib is pinned to
// ES2023, silent staleness the moment it is bumped.
export class ReactiveSet<T> extends Set<T> {
  #version = createVersion();

  constructor(values?: readonly T[] | null) {
    // same constructor ordering caveat as ReactiveMap
    super();
    if (values) {
      for (const value of values) super.add(value);
    }
  }

  get size(): number {
    this.#version.track();
    return super.size;
  }

  has(value: T): boolean {
    this.#version.track();
    return super.has(value);
  }

  add(value: T): this {
    const unchanged = super.has(value);
    super.add(value);
    if (!unchanged) this.#version.bump();
    return this;
  }

  delete(value: T): boolean {
    const deleted = super.delete(value);
    if (deleted) this.#version.bump();
    return deleted;
  }

  clear(): void {
    const hadValues = super.size > 0;
    super.clear();
    if (hadValues) this.#version.bump();
  }

  forEach(
    callback: (value: T, value2: T, set: Set<T>) => void,
    thisArg?: unknown,
  ): void {
    this.#version.track();
    super.forEach(callback, thisArg);
  }

  keys(): SetIterator<T> {
    this.#version.track();
    return super.keys();
  }

  values(): SetIterator<T> {
    this.#version.track();
    return super.values();
  }

  entries(): SetIterator<[T, T]> {
    this.#version.track();
    return super.entries();
  }

  [Symbol.iterator](): SetIterator<T> {
    this.#version.track();
    return super[Symbol.iterator]();
  }
}

export const reactiveMap = <K, V>(
  entries?: readonly (readonly [K, V])[] | null,
) => new ReactiveMap<K, V>(entries);

export const reactiveSet = <T>(values?: readonly T[] | null) =>
  new ReactiveSet<T>(values);
