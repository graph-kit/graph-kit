import { describe, expect, it } from 'vitest';

import {
  isGraphServerState,
  serverStateFromTransit,
  transitFromServerState,
} from './server-state.ts';

const transitPayload = () => ({
  core: {
    nodes: [{ id: 'n1' }, { id: 'n2' }],
    edges: [{ id: 'e1', source: 'n1', target: 'n2' }],
    edgeWeights: [{ id: 'e1', weight: '3' }],
    nodePositions: [
      { id: 'n1', position: { x: 10, y: 20, z: 0 } },
      { id: 'n2', position: { x: 30, y: 40, z: 0 } },
    ],
  },
  nodeLabel: [
    { nodeId: 'n1', label: 'A' },
    { nodeId: 'n2', label: 'B' },
  ],
  canvas: { panX: 5, panY: 6, zoom: 2 },
});

describe('serverStateFromTransit', () => {
  it('merges everything about a node under its own id', () => {
    const serverState = serverStateFromTransit(transitPayload());

    expect(serverState.nodes.n1).toEqual({
      position: { x: 10, y: 20, z: 0 },
      label: 'A',
    });
  });

  it('merges edge weight into the edge record', () => {
    const serverState = serverStateFromTransit(transitPayload());

    expect(serverState.edges.e1).toEqual({
      source: 'n1',
      target: 'n2',
      weight: '3',
    });
  });

  // syncing the camera would yank every participant's viewport on each remote change
  it('never carries the camera into the room', () => {
    const serverState = serverStateFromTransit(transitPayload());

    expect(JSON.stringify(serverState)).not.toContain('panX');
  });

  it('throws on a node with no recorded label or position', () => {
    const payload = transitPayload();
    payload.core.nodes.push({ id: 'n3' });

    expect(() => serverStateFromTransit(payload)).toThrow('n3');
  });
});

describe('round trip', () => {
  // the seam where a plugin adding transit state would silently drop data
  it('is identity through server state and back', () => {
    const payload = transitPayload();
    const serverState = serverStateFromTransit(payload);
    const restored = transitFromServerState(serverState, payload);

    expect(restored.core).toEqual(payload.core);
    expect(restored.nodeLabel).toEqual(payload.nodeLabel);
    expect(restored.canvas).toEqual(payload.canvas);
  });

  it('survives an empty graph', () => {
    const payload = {
      core: { nodes: [], edges: [], edgeWeights: [], nodePositions: [] },
      nodeLabel: [],
      canvas: { panX: 0, panY: 0, zoom: 1 },
    };
    const restored = transitFromServerState(
      serverStateFromTransit(payload),
      payload,
    );

    expect(restored).toEqual(payload);
  });

  // a resync must not disturb the camera the local user has set
  it('takes the camera from local state, not from the room', () => {
    const remote = transitPayload();
    const local = {
      ...transitPayload(),
      canvas: { panX: 99, panY: 99, zoom: 9 },
    };

    const restored = transitFromServerState(
      serverStateFromTransit(remote),
      local,
    );

    expect(restored.canvas).toEqual({ panX: 99, panY: 99, zoom: 9 });
  });
});

describe('isGraphServerState', () => {
  it('accepts real graph server state', () => {
    const serverState = serverStateFromTransit(transitPayload());

    expect(isGraphServerState(serverState)).toBe(true);
  });

  // reports only: the multiplayer layer owns what a false means, since it is the
  // side that knows which product and version the state arrived under
  it('rejects a foreign shape without throwing', () => {
    expect(isGraphServerState({ queries: [], sets: [] })).toBe(false);
  });

  it('rejects an empty payload', () => {
    expect(isGraphServerState({})).toBe(false);
  });
});
