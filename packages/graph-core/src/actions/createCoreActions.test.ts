import { nullThrows } from '@core/utils/assert';
import { effect } from '@reactive/primitives/index';
import { describe, expect, it } from 'vitest';

import { core } from '../index.ts';
import { createCoreActions } from './createCoreActions.ts';

/**
 * an observed state is what a single derivation sees when it wakes up. the invariant is
 * that every one of them is a graph that actually existed, never a halfway point between
 * two writes of the same action.
 */
const observeStructure = (graph: ReturnType<typeof core>) => {
  const observed: { nodes: string[]; edges: string[] }[] = [];

  const stop = effect(() => {
    observed.push({
      nodes: graph.controls.nodes().map((n) => n.id),
      edges: graph.controls.edges().map((e) => e.id),
    });
  });

  // drop the effect's initial synchronous run so only reactions are recorded
  observed.length = 0;

  return { observed, stop };
};

const danglingEdges = ({
  nodes,
  edges,
}: {
  nodes: string[];
  edges: string[];
}) => edges.filter((id) => id === 'edge-1' && !nodes.includes('node-1'));

describe(createCoreActions, () => {
  it('never exposes an edge whose node has already been removed', () => {
    const graph = core({});
    graph.actions.addNode({ id: 'node-1' });
    graph.actions.addNode({ id: 'node-2' });
    graph.actions.addEdge({
      id: 'edge-1',
      source: 'node-1',
      target: 'node-2',
    });

    const { observed, stop } = observeStructure(graph);
    graph.actions.removeNode({ id: 'node-1' });
    stop();

    expect(observed.flatMap(danglingEdges)).toEqual([]);
  });

  it('wakes derivations once per action rather than once per write', () => {
    const graph = core({});
    graph.actions.addNode({ id: 'node-1' });
    graph.actions.addNode({ id: 'node-2' });
    graph.actions.addEdge({
      id: 'edge-1',
      source: 'node-1',
      target: 'node-2',
    });

    const { observed, stop } = observeStructure(graph);
    graph.actions.removeNode({ id: 'node-1' });
    stop();

    expect(observed).toEqual([{ nodes: ['node-2'], edges: [] }]);
  });

  it('holds for removeElements clearing the whole graph', () => {
    const graph = core({});
    const node1 = graph.actions.addNode({ id: 'node-1' });
    const node2 = graph.actions.addNode({ id: 'node-2' });
    graph.actions.addEdge({
      id: 'edge-1',
      source: 'node-1',
      target: 'node-2',
    });

    const { observed, stop } = observeStructure(graph);
    graph.actions.removeElements({
      nodes: [
        nullThrows(node1, 'node-1 was refused'),
        nullThrows(node2, 'node-2 was refused'),
      ],
      edges: [],
    });
    stop();

    expect(observed).toEqual([{ nodes: [], edges: [] }]);
  });

  it('holds across a decode, which rebuilds outside the action layer', () => {
    const graph = core({});
    graph.actions.addNode({ id: 'node-1' });
    graph.actions.addNode({ id: 'node-2' });
    graph.actions.addEdge({
      id: 'edge-1',
      source: 'node-1',
      target: 'node-2',
    });
    const snapshot = graph.transit.encode();

    graph.actions.addNode({ id: 'node-3' });

    const { observed, stop } = observeStructure(graph);
    graph.transit.decode(snapshot);
    stop();

    expect(observed).toEqual([
      { nodes: ['node-1', 'node-2'], edges: ['edge-1'] },
    ]);
  });
});
