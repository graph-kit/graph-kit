import { describe, expect, it } from 'vitest';

import { GraphEncode } from '../graph/types.ts';
import { graphTransitCompression } from './transit-compression.ts';

const { compress, decompress } = graphTransitCompression;

const roundTrip = (payload: GraphEncode): GraphEncode =>
  decompress(compress(payload));

const payloadOf = (payload: Partial<GraphEncode> = {}): GraphEncode => ({
  core: {
    nodes: [{ id: 'aaa1111' }, { id: 'bbb2222' }, { id: 'ccc3333' }],
    edges: [
      { id: 'eee1111', source: 'aaa1111', target: 'bbb2222' },
      { id: 'eee2222', source: 'bbb2222', target: 'ccc3333' },
    ],
    nodePositions: [
      { id: 'aaa1111', position: { x: 100, y: 200, z: 1 } },
      { id: 'bbb2222', position: { x: -40, y: 60, z: 1 } },
      { id: 'ccc3333', position: { x: 0, y: 0, z: 1 } },
    ],
    edgeWeights: [{ id: 'eee1111', weight: '3/4' }],
  },
  surface: { panX: 12.34, panY: -56.78, zoom: 1.5 },
  nodeLabel: [
    { nodeId: 'aaa1111', label: 'A' },
    { nodeId: 'ccc3333', label: 'C' },
  ],
  annotations: [],
  ...payload,
});

/** what an edge connects, by ordinal, which is the only identity that survives */
const edgesByOrdinal = ({ core }: GraphEncode) => {
  const ordinalOf = (id: string) =>
    core.nodes.findIndex((one) => one.id === id);
  return core.edges.map((edge) => [
    ordinalOf(edge.source),
    ordinalOf(edge.target),
  ]);
};

const labelsByOrdinal = ({ core, nodeLabel }: GraphEncode) =>
  nodeLabel.map(({ nodeId, label }) => [
    core.nodes.findIndex((one) => one.id === nodeId),
    label,
  ]);

describe('graphTransitCompression', () => {
  it('round trips structure, positions, weights, labels and camera', () => {
    const payload = payloadOf();
    const result = roundTrip(payload);

    expect(result.core.nodes).toHaveLength(3);
    expect(edgesByOrdinal(result)).toEqual(edgesByOrdinal(payload));
    expect(labelsByOrdinal(result)).toEqual(labelsByOrdinal(payload));
    expect(result.surface).toEqual(payload.surface);
    expect(result.core.nodePositions.map(({ position }) => position)).toEqual(
      payload.core.nodePositions.map(({ position }) => position),
    );
  });

  it('keeps a weight on the edge that had it', () => {
    const result = roundTrip(payloadOf());
    const [first, second] = result.core.edges;

    expect(result.core.edgeWeights).toHaveLength(1);
    expect(result.core.edgeWeights[0]?.id).toBe(first?.id);
    expect(result.core.edgeWeights.map(({ id }) => id)).not.toContain(
      second?.id,
    );
    expect(result.core.edgeWeights[0]?.weight).toBe('3/4');
  });

  it('rounds positions to whole units', () => {
    const payload = payloadOf({
      core: {
        ...payloadOf().core,
        nodePositions: [
          { id: 'aaa1111', position: { x: 100.4, y: 200.6, z: 1 } },
          { id: 'bbb2222', position: { x: -40.5, y: 60.2, z: 1 } },
          { id: 'ccc3333', position: { x: 0.49, y: -0.49, z: 1 } },
        ],
      },
    });

    expect(
      roundTrip(payload).core.nodePositions.map((one) => one.position),
    ).toEqual([
      { x: 100, y: 201, z: 1 },
      { x: -40, y: 60, z: 1 },
      { x: 0, y: 0, z: 1 },
    ]);
  });

  it('carries a z that is not the default', () => {
    const payload = payloadOf({
      core: {
        ...payloadOf().core,
        nodePositions: [
          { id: 'aaa1111', position: { x: 1, y: 2, z: 7 } },
          { id: 'bbb2222', position: { x: 3, y: 4, z: 1 } },
          { id: 'ccc3333', position: { x: 5, y: 6, z: 1 } },
        ],
      },
    });

    expect(
      roundTrip(payload).core.nodePositions.map(({ position }) => position.z),
    ).toEqual([7, 1, 1]);
  });

  it('drops a label whose node is no longer there', () => {
    const payload = payloadOf({
      nodeLabel: [
        { nodeId: 'aaa1111', label: 'A' },
        { nodeId: 'gone999', label: 'orphan' },
      ],
    });

    expect(labelsByOrdinal(roundTrip(payload))).toEqual([[0, 'A']]);
  });

  it('refuses an edge whose endpoint is no longer there', () => {
    const payload = payloadOf({
      core: {
        ...payloadOf().core,
        edges: [{ id: 'eee1111', source: 'aaa1111', target: 'gone999' }],
        edgeWeights: [],
      },
    });

    expect(() => compress(payload)).toThrow();
  });

  it('survives a label carrying every separator', () => {
    const label = 'a|b;c,d%e f';
    const payload = payloadOf({ nodeLabel: [{ nodeId: 'aaa1111', label }] });

    expect(roundTrip(payload).nodeLabel[0]?.label).toBe(label);
  });

  it('round trips a graph with nothing in it', () => {
    const payload = payloadOf({
      core: { nodes: [], edges: [], nodePositions: [], edgeWeights: [] },
      nodeLabel: [],
    });
    const result = roundTrip(payload);

    expect(result.core.nodes).toEqual([]);
    expect(result.core.edges).toEqual([]);
    expect(result.nodeLabel).toEqual([]);
    expect(result.annotations).toEqual([]);
  });

  it('round trips annotations alongside the graph', () => {
    const payload = payloadOf({
      annotations: [
        {
          id: 'ann1111',
          type: 'draw',
          points: [
            { x: 5, y: 5 },
            { x: 25, y: 30 },
          ],
          fillColor: '#ff0000',
          brushWeight: 4,
        },
      ],
    });

    const [annotation] = roundTrip(payload).annotations;
    expect(annotation?.points).toEqual([
      { x: 5, y: 5 },
      { x: 25, y: 30 },
    ]);
    expect(annotation?.fillColor).toBe('#ff0000');
    expect(annotation?.brushWeight).toBe(4);
  });

  it('mints ids that are fresh and unique', () => {
    const { core } = roundTrip(payloadOf());
    const ids = [...core.nodes, ...core.edges].map((one) => one.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).not.toContain('aaa1111');
    expect(ids.every(Boolean)).toBe(true);
  });

  it('refuses a version it does not know', () => {
    const compressed = compress(payloadOf());
    expect(() => decompress(`9${compressed.slice(1)}`)).toThrow();
  });

  it('refuses a payload missing sections', () => {
    expect(() => decompress('1|0,0,1')).toThrow();
  });

  it('refuses an edge pointing at a node that is not there', () => {
    expect(() => decompress('1|0,0,1|0,0|0,9||1||')).toThrow();
  });

  it('is far smaller than the same payload as json', () => {
    const nodes = Array.from({ length: 20 }, (_, i) => ({ id: `node${i}xy` }));
    const edges = Array.from({ length: 30 }, (_, i) => ({
      id: `edge${i}xy`,
      source: `node${i % 20}xy`,
      target: `node${(i + 7) % 20}xy`,
    }));

    const payload = payloadOf({
      core: {
        nodes,
        edges,
        nodePositions: nodes.map((node, i) => ({
          id: node.id,
          position: { x: i * 83.4712, y: i * -41.9903, z: 1 },
        })),
        edgeWeights: edges.map((edge) => ({ id: edge.id, weight: '1' })),
      },
      nodeLabel: nodes.map((node, i) => ({ nodeId: node.id, label: `${i}` })),
    });

    expect(compress(payload).length).toBeLessThan(
      JSON.stringify(payload).length / 4,
    );
  });
});
