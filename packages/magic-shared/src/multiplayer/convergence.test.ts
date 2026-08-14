import { PatchOp, hashServerState } from '@multiplayer/protocol/server-state';
import { applyPatch } from 'fast-json-patch';
import { describe, expect, it } from 'vitest';

import {
  encodeElementsAdded,
  encodeElementsRemoved,
  encodePositionsCommitted,
} from '../product/server-state-ops.ts';
import { GraphServerState } from '../product/server-state.ts';

/**
 * The property the whole design rests on: ops are id-keyed, so two peers applying the
 * same set in different orders land on identical state. This is what index-based RFC
 * 6902 paths would silently break, and the failure mode there is corruption rather
 * than an error, so it is worth pinning directly.
 */

const emptyServerState = (): GraphServerState => ({
  nodes: {},
  edges: {},
  plugins: {},
});

const graphStub = {
  positions: { get: (id: string) => ({ x: id.length, y: 0, z: 0 }) },
  getNode: (id: string) => ({ id, label: id.toUpperCase() }),
  getEdge: (id: string) => ({
    id,
    source: 'n1',
    target: 'n2',
    weight: { toString: () => '1' },
  }),
} as never;

const apply = (state: GraphServerState, ops: PatchOp[]) =>
  applyPatch(
    structuredClone(state),
    ops as Parameters<typeof applyPatch>[1],
    true,
    false,
  ).newDocument as GraphServerState;

describe('order independence', () => {
  it('converges when two peers apply the same ops in opposite orders', () => {
    const base = emptyServerState();

    const addNodes = encodeElementsAdded(graphStub, {
      addedNodes: [{ id: 'n1' }, { id: 'n2' }],
      addedEdges: [],
    });
    const moveNode = encodePositionsCommitted([
      { nodeId: 'n1', position: { x: 99, y: 12, z: 0 } },
    ]);

    const seeded = apply(base, addNodes);

    const peerOne = apply(apply(seeded, moveNode), []);
    const peerTwo = apply(apply(seeded, []), moveNode);

    expect(hashServerState(peerOne)).toBe(hashServerState(peerTwo));
  });

  // two users dragging different nodes is the everyday concurrent case
  it('keeps both edits when two peers move different nodes', () => {
    const seeded = apply(
      emptyServerState(),
      encodeElementsAdded(graphStub, {
        addedNodes: [{ id: 'n1' }, { id: 'n2' }],
        addedEdges: [],
      }),
    );

    const moveFirst = encodePositionsCommitted([
      { nodeId: 'n1', position: { x: 10, y: 0, z: 0 } },
    ]);
    const moveSecond = encodePositionsCommitted([
      { nodeId: 'n2', position: { x: 20, y: 0, z: 0 } },
    ]);

    const oneThenTwo = apply(apply(seeded, moveFirst), moveSecond);
    const twoThenOne = apply(apply(seeded, moveSecond), moveFirst);

    expect(hashServerState(oneThenTwo)).toBe(hashServerState(twoThenOne));
    expect(oneThenTwo.nodes.n1.position.x).toBe(10);
    expect(oneThenTwo.nodes.n2.position.x).toBe(20);
  });

  it('leaves no orphan edge when a node and its edge are removed together', () => {
    const seeded = apply(
      emptyServerState(),
      encodeElementsAdded(graphStub, {
        addedNodes: [{ id: 'n1' }, { id: 'n2' }],
        addedEdges: [{ id: 'e1' }],
      }),
    );
    expect(Object.keys(seeded.edges)).toEqual(['e1']);

    const removed = apply(
      seeded,
      encodeElementsRemoved({
        removedNodeIds: ['n1'],
        removedEdgeIds: ['e1'],
      }),
    );

    expect(removed.edges).toEqual({});
    expect(Object.keys(removed.nodes)).toEqual(['n2']);
  });

  // the hash is what the drift check compares, so it must not depend on the order
  // keys happen to have been written in
  it('hashes identically regardless of insertion order', () => {
    const built = apply(
      emptyServerState(),
      encodeElementsAdded(graphStub, {
        addedNodes: [{ id: 'n1' }, { id: 'n2' }],
        addedEdges: [],
      }),
    );
    const reversed = apply(
      emptyServerState(),
      encodeElementsAdded(graphStub, {
        addedNodes: [{ id: 'n2' }, { id: 'n1' }],
        addedEdges: [],
      }),
    );

    expect(hashServerState(built)).toBe(hashServerState(reversed));
  });
});
