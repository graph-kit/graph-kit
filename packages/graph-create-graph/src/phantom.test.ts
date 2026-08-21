import { AggregatorTransformer } from '@canvas/primitives/aggregator/types';
import { CanvasElement } from '@canvas/primitives/aggregator/types';
import { createThemeController } from '@core/themes/index';
import { core } from '@graph/core/index';
import { phantom } from '@graph/plugins/phantom/index';
import { PhantomControls } from '@graph/plugins/phantom/types';
import { createSurfaceThemeOverrides } from '@graph/plugins/surface/themes';
import { beforeEach, describe, expect, it } from 'vitest';

import { foldPlugins } from './fold-plugins.ts';
import { createGraphTransit } from './graph-transit.ts';

// phantom only reaches for the aggregator and the theme layer, so the rest of the real
// surface plugin (a live surface, a renderer, hit testing) is not worth standing up here
const createSurfaceStub = (transformers: AggregatorTransformer[]) => () => ({
  name: 'surface',
  controls: {
    aggregator: {
      addTransformer: (fn: AggregatorTransformer) => transformers.push(fn),
    },
    theme: createThemeController(createSurfaceThemeOverrides()),
  },
});

const setup = () => {
  const coreGraph = core({});
  const transformers: AggregatorTransformer[] = [];

  const folded = foldPlugins(
    coreGraph,
    [createSurfaceStub(transformers), phantom] as any,
    { '': { surface: {} } },
    () => '',
  );

  // stand-ins that echo what they were handed, so a render pass is inspectable without
  // pulling in shapes or a detector map
  folded.resolveFinalRenderFunctions({
    node: () => (node) => ({ drew: 'node', id: node.id }) as any,
    edge: () => (edge) =>
      ({
        drew: 'edge',
        id: edge.id,
        source: edge.source,
        target: edge.target,
      }) as any,
  });

  folded.resolveFinalTokenResolver(((token: string) => token) as any);

  const transit = createGraphTransit({
    pluginTransitControls: folded.pluginTransitControls,
    coreGraph,
    consumerEvents: folded.consumerEvents,
    transitEvents: folded.transitEvents,
  });

  return {
    actions: folded.actions,
    transit,
    positions: coreGraph.controls.positions,
    phantom: folded.controls.phantom as PhantomControls,
    render: () =>
      transformers.reduce<CanvasElement[]>(
        (elements, transform) => transform(elements),
        [],
      ),
  };
};

const phantomNode = (id: string, x = 0, y = 0) => ({
  id,
  position: { x, y },
  label: id,
});

const phantomEdge = (id: string, source: string, target: string) => ({
  id,
  source,
  target,
});

const idsOf = (elements: readonly { id: string }[]) =>
  elements.map((element) => element.id);

describe('phantom', () => {
  let graph: ReturnType<typeof setup>;

  beforeEach(() => {
    graph = setup();
  });

  describe('adding', () => {
    it('holds nodes and edges the graph does not contain', () => {
      graph.phantom.addNode(phantomNode('pn1'));
      graph.phantom.addEdge(phantomEdge('pe1', 'pn1', 'pn1'));

      expect(idsOf(graph.phantom.nodes())).toEqual(['pn1']);
      expect(idsOf(graph.phantom.edges())).toEqual(['pe1']);
    });

    it('bulk adds through addElements', () => {
      graph.phantom.addElements({
        nodes: [phantomNode('pn1'), phantomNode('pn2')],
        edges: [phantomEdge('pe1', 'pn1', 'pn2')],
      });

      expect(idsOf(graph.phantom.nodes())).toEqual(['pn1', 'pn2']);
      expect(idsOf(graph.phantom.edges())).toEqual(['pe1']);
    });
  });

  describe('removing', () => {
    beforeEach(() => {
      graph.phantom.addElements({
        nodes: [phantomNode('pn1'), phantomNode('pn2'), phantomNode('pn3')],
        edges: [
          phantomEdge('pe1', 'pn1', 'pn2'),
          phantomEdge('pe2', 'pn2', 'pn3'),
        ],
      });
    });

    it('removes a single edge and leaves its endpoints alone', () => {
      graph.phantom.removeEdge('pe1');

      expect(idsOf(graph.phantom.edges())).toEqual(['pe2']);
      expect(idsOf(graph.phantom.nodes())).toEqual(['pn1', 'pn2', 'pn3']);
    });

    it('takes attached edges with a removed node', () => {
      const removed = graph.phantom.removeNode('pn2');

      expect(removed).toEqual({
        removedNodeIds: ['pn2'],
        removedEdgeIds: ['pe1', 'pe2'],
      });
      expect(idsOf(graph.phantom.nodes())).toEqual(['pn1', 'pn3']);
      expect(graph.phantom.edges()).toEqual([]);
    });

    it('cascades across a bulk removal', () => {
      const removed = graph.phantom.removeElements({
        nodeIds: ['pn1'],
        edgeIds: ['pe2'],
      });

      expect(removed).toEqual({
        removedNodeIds: ['pn1'],
        removedEdgeIds: ['pe1', 'pe2'],
      });
      expect(graph.phantom.edges()).toEqual([]);
    });

    it('reports only what it actually held', () => {
      const removed = graph.phantom.removeElements({
        nodeIds: ['pn1', 'never-existed'],
        edgeIds: ['also-never-existed'],
      });

      expect(removed).toEqual({
        removedNodeIds: ['pn1'],
        removedEdgeIds: ['pe1'],
      });
    });
  });

  describe('getNodePosition', () => {
    it('resolves phantom nodes from their own position', () => {
      graph.phantom.addNode(phantomNode('pn1', 10, 20));

      expect(graph.phantom.getNodePosition('pn1')).toMatchObject({
        x: 10,
        y: 20,
      });
    });

    it('resolves real nodes through core', () => {
      const node = graph.actions.addNode({ position: { x: 7, y: 9 } });

      expect(graph.phantom.getNodePosition(node.id)).toMatchObject({
        x: 7,
        y: 9,
      });
    });

    it('throws for an id belonging to neither', () => {
      expect(() => graph.phantom.getNodePosition('nope')).toThrow();
    });
  });

  describe('dangling edges', () => {
    it('drops a phantom edge when the real node it points at is removed', () => {
      const node = graph.actions.addNode({});
      graph.phantom.addNode(phantomNode('pn1'));
      graph.phantom.addEdge(phantomEdge('pe1', 'pn1', node.id));

      graph.actions.removeNode({ id: node.id });

      expect(graph.phantom.edges()).toEqual([]);
    });

    it('leaves phantom-only edges alone when a real node is removed', () => {
      const node = graph.actions.addNode({});
      graph.phantom.addElements({
        nodes: [phantomNode('pn1'), phantomNode('pn2')],
        edges: [phantomEdge('pe1', 'pn1', 'pn2')],
      });

      graph.actions.removeNode({ id: node.id });

      expect(idsOf(graph.phantom.edges())).toEqual(['pe1']);
    });

    it('keeps phantom nodes that share an id with a removed real node', () => {
      const node = graph.actions.addNode({ id: 'shared' });
      graph.phantom.addNode(phantomNode('shared'));

      graph.actions.removeNode({ id: node.id });

      expect(idsOf(graph.phantom.nodes())).toEqual(['shared']);
    });

    it('survives a render pass after the real endpoint is removed', () => {
      const node = graph.actions.addNode({});
      graph.phantom.addNode(phantomNode('pn1'));
      graph.phantom.addEdge(phantomEdge('pe1', 'pn1', node.id));

      graph.actions.removeNode({ id: node.id });

      expect(() => graph.render()).not.toThrow();
    });

    it('drops edges orphaned by a transit decode', () => {
      const survivor = graph.actions.addNode({});
      const snapshot = graph.transit.encode();
      const doomed = graph.actions.addNode({});

      graph.phantom.addNode(phantomNode('pn1'));
      graph.phantom.addElements({
        nodes: [],
        edges: [
          phantomEdge('attached-to-doomed', 'pn1', doomed.id),
          phantomEdge('attached-to-survivor', 'pn1', survivor.id),
        ],
      });

      graph.transit.decode(snapshot);

      // decode reports every pre-decode node as removed, survivor included, so pruning
      // off the event payload alone would take the still-valid edge with it
      expect(idsOf(graph.phantom.edges())).toEqual(['attached-to-survivor']);
    });
  });

  describe('rendering', () => {
    it('draws phantom nodes and edges through the graph render functions', () => {
      graph.phantom.addElements({
        nodes: [phantomNode('pn1'), phantomNode('pn2')],
        edges: [phantomEdge('pe1', 'pn1', 'pn2')],
      });

      const drawn = graph.render();

      expect(idsOf(drawn)).toEqual(['pn1', 'pn2', 'pe1']);
      expect(drawn.map((element) => element.shape)).toMatchObject([
        { drew: 'node' },
        { drew: 'node' },
        { drew: 'edge' },
      ]);
    });

    it('hands an edge the resolved positions of both endpoints', () => {
      const node = graph.actions.addNode({ position: { x: 7, y: 9 } });
      graph.phantom.addNode(phantomNode('pn1', 10, 20));
      graph.phantom.addEdge(phantomEdge('pe1', 'pn1', node.id));

      const edgeElement = graph.render().find((el) => el.id === 'pe1');

      expect(edgeElement?.shape).toMatchObject({
        source: { id: 'pn1', position: { x: 10, y: 20 } },
        target: { id: node.id, position: { x: 7, y: 9 } },
      });
    });

    it('renders edges beneath nodes', () => {
      graph.phantom.addElements({
        nodes: [phantomNode('pn1')],
        edges: [phantomEdge('pe1', 'pn1', 'pn1')],
      });

      const drawn = graph.render();
      const node = drawn.find((element) => element.id === 'pn1');
      const edge = drawn.find((element) => element.id === 'pe1');

      expect(edge!.priority).toBeLessThan(node!.priority);
    });
  });
});
