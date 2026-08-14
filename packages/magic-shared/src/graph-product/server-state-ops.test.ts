import { PatchOp } from '@multiplayer/protocol/server-state';
import Fraction from 'fraction.js';
import { describe, expect, it, vi } from 'vitest';

import {
  applyOpsToGraph,
  encodeElementsRemoved,
  encodePositionsCommitted,
  encodeWeightsChanged,
} from './server-state-ops.ts';

/**
 * a recording stand-in rather than a real graph: what is worth pinning here is the path
 * parsing and the batching, since the mutations themselves are covered in graph-core
 */
const recordingGraph = () => {
  const calls = {
    addElements: vi.fn(),
    removeElements: vi.fn(),
    setPositions: vi.fn(),
    setWeights: vi.fn(),
    setLabels: vi.fn(),
  };

  const graph = {
    actions: {
      addElements: calls.addElements,
      removeElements: calls.removeElements,
    },
    positions: { setMany: calls.setPositions },
    weights: { setMany: calls.setWeights },
    nodeLabel: { setMany: calls.setLabels },
  };

  return { graph: graph as never, calls };
};

const addNodeOp = (id: string, x = 0, y = 0): PatchOp => ({
  op: 'add',
  path: `/nodes/${id}`,
  value: { position: { x, y, z: 0 }, label: id.toUpperCase() },
});

const addEdgeOp = (id: string, source: string, target: string): PatchOp => ({
  op: 'add',
  path: `/edges/${id}`,
  value: { source, target, weight: '2' },
});

describe('applyOpsToGraph', () => {
  it('applies one inbound message as one add action', () => {
    const { graph, calls } = recordingGraph();

    applyOpsToGraph(graph, [
      addNodeOp('n1', 5, 6),
      addNodeOp('n2'),
      addEdgeOp('e1', 'n1', 'n2'),
    ]);

    expect(calls.addElements).toHaveBeenCalledTimes(1);
    const [payload] = calls.addElements.mock.calls[0];
    expect(payload.nodes).toHaveLength(2);
    expect(payload.edges).toHaveLength(1);
    expect(payload.nodes[0]).toMatchObject({
      id: 'n1',
      label: 'N1',
      x: 5,
      y: 6,
    });
  });

  it('reconstructs edge weight as a fraction, not a string', () => {
    const { graph, calls } = recordingGraph();

    applyOpsToGraph(graph, [addEdgeOp('e1', 'n1', 'n2')]);

    const [payload] = calls.addElements.mock.calls[0];
    expect(payload.edges[0].weight.toString()).toBe('2');
    expect(typeof payload.edges[0].weight).toBe('object');
  });

  it('batches removals into one action', () => {
    const { graph, calls } = recordingGraph();

    applyOpsToGraph(graph, [
      { op: 'remove', path: '/edges/e1' },
      { op: 'remove', path: '/nodes/n1' },
      { op: 'remove', path: '/nodes/n2' },
    ]);

    expect(calls.removeElements).toHaveBeenCalledTimes(1);
    const [payload] = calls.removeElements.mock.calls[0];
    expect(payload.nodes).toEqual([{ id: 'n1' }, { id: 'n2' }]);
    expect(payload.edges).toEqual([{ id: 'e1' }]);
  });

  // an action that replaced an element encodes as both, and adding first would
  // recreate what the removal is about to take away
  it('removes before it adds', () => {
    const { graph, calls } = recordingGraph();
    const order: string[] = [];
    calls.removeElements.mockImplementation(() => order.push('remove'));
    calls.addElements.mockImplementation(() => order.push('add'));

    applyOpsToGraph(graph, [
      addNodeOp('n2'),
      { op: 'remove', path: '/nodes/n1' },
    ]);

    expect(order).toEqual(['remove', 'add']);
  });

  it('routes a position replace to the position store', () => {
    const { graph, calls } = recordingGraph();

    applyOpsToGraph(graph, [
      {
        op: 'replace',
        path: '/nodes/n1/position',
        value: { x: 9, y: 4, z: 0 },
      },
    ]);

    expect(calls.setPositions).toHaveBeenCalledWith([
      { nodeId: 'n1', update: { x: 9, y: 4, z: 0 } },
    ]);
    expect(calls.addElements).not.toHaveBeenCalled();
  });

  it('routes a weight replace to the weight store', () => {
    const { graph, calls } = recordingGraph();

    applyOpsToGraph(graph, [
      { op: 'replace', path: '/edges/e1/weight', value: '3/4' },
    ]);

    const [updates] = calls.setWeights.mock.calls[0];
    expect(updates[0].edgeId).toBe('e1');
    expect(updates[0].update.equals(new Fraction('3/4'))).toBe(true);
  });

  /**
   * the wire carries whatever Fraction.toString produces, which is a decimal rather
   * than the "3/4" form it was constructed from. what has to hold is that the value
   * survives, since core's transit encodes weights the same way and a lossy round trip
   * would show up as permanent drift on every weighted edge.
   */
  it('preserves weight value through the toString the wire uses', () => {
    const { graph, calls } = recordingGraph();
    const original = new Fraction('1/3');

    applyOpsToGraph(graph, [
      { op: 'replace', path: '/edges/e1/weight', value: original.toString() },
    ]);

    const [updates] = calls.setWeights.mock.calls[0];
    expect(updates[0].update.equals(original)).toBe(true);
  });

  it('routes a label replace to the label store', () => {
    const { graph, calls } = recordingGraph();

    applyOpsToGraph(graph, [
      { op: 'replace', path: '/nodes/n1/label', value: 'renamed' },
    ]);

    expect(calls.setLabels).toHaveBeenCalledWith([
      { nodeId: 'n1', label: 'renamed' },
    ]);
  });

  // a peer on a newer version may send paths this client has no handler for, and
  // dropping them beats throwing on every relay
  it('ignores paths it does not recognise', () => {
    const { graph, calls } = recordingGraph();

    applyOpsToGraph(graph, [
      { op: 'replace', path: '/nodes/n1/somethingNew', value: 1 },
      { op: 'add', path: '/futureCollection/x', value: {} },
      { op: 'replace', path: '/', value: {} },
    ]);

    expect(calls.addElements).not.toHaveBeenCalled();
    expect(calls.removeElements).not.toHaveBeenCalled();
    expect(calls.setPositions).not.toHaveBeenCalled();
  });

  it('touches nothing for an empty op list', () => {
    const { graph, calls } = recordingGraph();

    applyOpsToGraph(graph, []);

    for (const call of Object.values(calls)) {
      expect(call).not.toHaveBeenCalled();
    }
  });
});

describe('encoders', () => {
  // edges first so the server never holds an edge whose endpoint is already gone
  it('orders edge removals ahead of node removals', () => {
    const ops = encodeElementsRemoved({
      removedNodeIds: ['n1'],
      removedEdgeIds: ['e1'],
    });

    expect(ops.map((op) => op.path)).toEqual(['/edges/e1', '/nodes/n1']);
  });

  it('encodes committed positions as replaces', () => {
    const ops = encodePositionsCommitted([
      { nodeId: 'n1', position: { x: 1, y: 2, z: 0 } },
    ]);

    expect(ops).toEqual([
      {
        op: 'replace',
        path: '/nodes/n1/position',
        value: { x: 1, y: 2, z: 0 },
      },
    ]);
  });

  it('encodes weights as strings so the wire stays plain json', () => {
    const ops = encodeWeightsChanged([
      { edgeId: 'e1', weight: { toString: () => '5/2' } },
    ]);

    expect(ops[0]).toEqual({
      op: 'replace',
      path: '/edges/e1/weight',
      value: '5/2',
    });
  });
});

describe('encode and apply round trip', () => {
  it('a removal encodes into ops that apply back to the same ids', () => {
    const { graph, calls } = recordingGraph();

    const ops = encodeElementsRemoved({
      removedNodeIds: ['n1', 'n2'],
      removedEdgeIds: ['e1'],
    });
    applyOpsToGraph(graph, ops);

    const [payload] = calls.removeElements.mock.calls[0];
    expect(payload.nodes).toEqual([{ id: 'n1' }, { id: 'n2' }]);
    expect(payload.edges).toEqual([{ id: 'e1' }]);
  });

  it('a position commit encodes and applies to the same coordinates', () => {
    const { graph, calls } = recordingGraph();

    const ops = encodePositionsCommitted([
      { nodeId: 'n1', position: { x: 12, y: 34, z: 0 } },
    ]);
    applyOpsToGraph(graph, ops);

    expect(calls.setPositions).toHaveBeenCalledWith([
      { nodeId: 'n1', update: { x: 12, y: 34, z: 0 } },
    ]);
  });
});
