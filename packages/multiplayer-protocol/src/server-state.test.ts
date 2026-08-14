import { describe, expect, it } from 'vitest';

import { hashServerState } from './server-state.ts';

describe('hashServerState', () => {
  // the failure this guards is silent: a server object built by applyPatch and a client
  // object built fresh differ in key insertion order, so an order sensitive hash would
  // report drift on every single relay
  it('ignores key insertion order', () => {
    const insertedOneWay = { nodes: { a: { x: 1 }, b: { x: 2 } }, edges: {} };
    const insertedAnother: Record<string, unknown> = {};
    insertedAnother.edges = {};
    insertedAnother.nodes = { b: { x: 2 }, a: { x: 1 } };

    expect(hashServerState(insertedOneWay)).toBe(
      hashServerState(insertedAnother),
    );
  });

  it('ignores key order at every depth', () => {
    const left = { core: { nodes: { a: { x: 1, y: 2 } } } };
    const right = { core: { nodes: { a: { y: 2, x: 1 } } } };

    expect(hashServerState(left)).toBe(hashServerState(right));
  });

  // arrays are ordered data, unlike object keys, so reordering one is a real change
  it('respects array order', () => {
    expect(hashServerState({ path: [1, 2] })).not.toBe(
      hashServerState({ path: [2, 1] }),
    );
  });

  it('changes when a value changes', () => {
    const before = { nodes: { a: { x: 1 } } };
    const after = { nodes: { a: { x: 2 } } };

    expect(hashServerState(before)).not.toBe(hashServerState(after));
  });

  it('distinguishes a missing key from a null one', () => {
    expect(hashServerState({ nodes: {} })).not.toBe(
      hashServerState({ nodes: null }),
    );
  });
});
