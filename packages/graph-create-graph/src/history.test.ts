import { core } from '@graph/core/index';
import { LooseGraphPlugin } from '@graph/plugins-shared/plugins';
import { history } from '@graph/plugins/history/index';
import { LooseGraphTransit } from '@graph/primitives/transit/types';
import { reactiveMap } from '@reactive/primitives/index';
import { beforeEach, describe, expect, it } from 'vitest';

import { foldPlugins } from './fold-plugins.ts';
import { createGraphTransit } from './graph-transit.ts';

// stands in for nodeLabel: owns a slice of per-node state that does not live on the
// node itself, and hands it to transit so anything graph-wide can round trip it. this
// is the case an inverse-action history could never restore.
const createLabelPlugin = (): LooseGraphPlugin => {
  const nodeIdToLabel = reactiveMap<string, string>();

  return ({ actions, getters, events }) => ({
    name: 'label',
    controls: {
      setLabel: (id: string, label: string) => {
        nodeIdToLabel.set(id, label);
      },
      getLabel: (id: string) => nodeIdToLabel.get(id),
    },
    events,
    getters,
    actions,
    transit: {
      encode: () =>
        Array.from(nodeIdToLabel).map(([nodeId, label]) => ({ nodeId, label })),
      decode: (data: { nodeId: string; label: string }[]) => {
        nodeIdToLabel.clear();
        for (const { nodeId, label } of data) nodeIdToLabel.set(nodeId, label);
      },
      validate: () => true,
    },
  });
};

// stands in for surface: transit state that must survive an undo rather than be
// restored by it. name matches PLUGINS_EXCLUDED_FROM_HISTORY.
const createSurfacePlugin = (): LooseGraphPlugin => {
  const camera = { zoom: 1 };

  return ({ actions, getters, events }) => ({
    name: 'surface',
    controls: {
      setZoom: (zoom: number) => {
        camera.zoom = zoom;
      },
      getZoom: () => camera.zoom,
    },
    events,
    getters,
    actions,
    transit: {
      encode: () => ({ zoom: camera.zoom }),
      decode: (data: { zoom: number }) => {
        camera.zoom = data.zoom;
      },
      validate: () => true,
    },
  });
};

/** mirrors what createGraph does, minus the theming machinery a real graph needs */
const setup = () => {
  const coreGraph = core({});
  const folded = foldPlugins(
    coreGraph,
    [history, createLabelPlugin(), createSurfacePlugin()],
    {},
    () => '',
  );

  const transit = createGraphTransit({
    pluginTransitControls: folded.pluginTransitControls,
    coreGraph,
    consumerEvents: folded.consumerEvents,
    transitEvents: folded.transitEvents,
  });
  folded.resolveFinalTransit(transit as LooseGraphTransit);

  return {
    actions: folded.actions,
    getNodes: folded.getNodes,
    transit: transit as LooseGraphTransit,
    historyControls: folded.controls.history as {
      captureSnapshot: () => void;
      undo: () => void;
      redo: () => void;
      canUndo: () => boolean;
      canRedo: () => boolean;
      clear: () => void;
      recordCount: () => number;
      lifecycle: { enable: () => void; disable: () => void };
    },
    label: folded.controls.label as {
      setLabel: (id: string, label: string) => void;
      getLabel: (id: string) => string | undefined;
    },
    surface: folded.controls.surface as {
      setZoom: (zoom: number) => void;
      getZoom: () => number;
    },
  };
};

/** history defers every capture to the microtask queue so same-tick calls collapse */
const settle = () => Promise.resolve();

describe('history', () => {
  let graph: ReturnType<typeof setup>;

  beforeEach(async () => {
    graph = setup();
    // the baseline snapshot is queued during fold
    await settle();
  });

  it('starts with only the baseline recorded and nothing to undo', () => {
    expect(graph.historyControls.recordCount()).toBe(1);
    expect(graph.historyControls.canUndo()).toBe(false);
    expect(graph.historyControls.canRedo()).toBe(false);
  });

  it('restores a removed node', async () => {
    const node = graph.actions.addNode({});
    graph.historyControls.captureSnapshot();
    await settle();

    graph.actions.removeNode({ id: node.id });
    graph.historyControls.captureSnapshot();
    await settle();
    expect(graph.getNodes()).toHaveLength(0);

    graph.historyControls.undo();
    expect(graph.getNodes().map((n) => n.id)).toEqual([node.id]);
  });

  it('restores plugin owned node state alongside the node', async () => {
    const node = graph.actions.addNode({});
    graph.label.setLabel(node.id, 'a');
    graph.historyControls.captureSnapshot();
    await settle();

    graph.actions.removeNode({ id: node.id });
    graph.historyControls.captureSnapshot();
    await settle();

    graph.historyControls.undo();
    expect(graph.label.getLabel(node.id)).toBe('a');
  });

  it('undoes a change to plugin state that never touched the graph structure', async () => {
    const node = graph.actions.addNode({});
    graph.label.setLabel(node.id, 'before');
    graph.historyControls.captureSnapshot();
    await settle();

    graph.label.setLabel(node.id, 'after');
    graph.historyControls.captureSnapshot();
    await settle();

    graph.historyControls.undo();
    expect(graph.label.getLabel(node.id)).toBe('before');
    graph.historyControls.redo();
    expect(graph.label.getLabel(node.id)).toBe('after');
  });

  it('collapses captures requested in the same tick into one record', async () => {
    graph.actions.addNode({});
    graph.historyControls.captureSnapshot();
    graph.historyControls.captureSnapshot();
    graph.historyControls.captureSnapshot();
    await settle();

    expect(graph.historyControls.recordCount()).toBe(2);
  });

  it('discards a capture that would record an identical state', async () => {
    graph.actions.addNode({});
    graph.historyControls.captureSnapshot();
    await settle();
    expect(graph.historyControls.recordCount()).toBe(2);

    graph.historyControls.captureSnapshot();
    await settle();
    expect(graph.historyControls.recordCount()).toBe(2);
  });

  it('drops the abandoned branch when a new state is recorded after an undo', async () => {
    const first = graph.actions.addNode({});
    graph.historyControls.captureSnapshot();
    await settle();

    graph.actions.addNode({});
    graph.historyControls.captureSnapshot();
    await settle();
    expect(graph.historyControls.recordCount()).toBe(3);

    graph.historyControls.undo();
    expect(graph.getNodes().map((n) => n.id)).toEqual([first.id]);

    graph.actions.addNode({});
    graph.historyControls.captureSnapshot();
    await settle();

    // baseline, first node, and the branch just taken. the second node's state is gone
    expect(graph.historyControls.recordCount()).toBe(3);
    expect(graph.historyControls.canRedo()).toBe(false);
  });

  it('does not record the undo itself as a new state', async () => {
    graph.actions.addNode({});
    graph.historyControls.captureSnapshot();
    await settle();

    graph.historyControls.undo();
    // a plugin noticing the restore and asking for a snapshot must not truncate the
    // future the undo just walked into
    graph.historyControls.captureSnapshot();
    await settle();

    expect(graph.historyControls.canRedo()).toBe(true);
    graph.historyControls.redo();
    expect(graph.getNodes()).toHaveLength(1);
  });

  it('leaves excluded plugin state untouched across a restore', async () => {
    graph.surface.setZoom(1);
    graph.actions.addNode({});
    graph.historyControls.captureSnapshot();
    await settle();

    graph.surface.setZoom(5);
    graph.historyControls.undo();

    expect(graph.getNodes()).toHaveLength(0);
    expect(graph.surface.getZoom()).toBe(5);
  });

  it('does not treat excluded plugin state as a new state worth recording', async () => {
    const recordsBefore = graph.historyControls.recordCount();

    graph.surface.setZoom(9);
    graph.historyControls.captureSnapshot();
    await settle();

    expect(graph.historyControls.recordCount()).toBe(recordsBefore);
  });

  it('stops recording while disabled', async () => {
    graph.historyControls.lifecycle.disable();

    graph.actions.addNode({});
    graph.historyControls.captureSnapshot();
    await settle();

    expect(graph.historyControls.recordCount()).toBe(1);
  });

  it('refuses to undo or redo while disabled', async () => {
    graph.actions.addNode({});
    graph.historyControls.captureSnapshot();
    await settle();

    graph.historyControls.lifecycle.disable();

    expect(graph.historyControls.canUndo()).toBe(false);
    graph.historyControls.undo();
    expect(graph.getNodes()).toHaveLength(1);

    graph.historyControls.lifecycle.enable();
    expect(graph.historyControls.canUndo()).toBe(true);
    graph.historyControls.undo();
    expect(graph.getNodes()).toHaveLength(0);

    graph.historyControls.lifecycle.disable();
    expect(graph.historyControls.canRedo()).toBe(false);
    graph.historyControls.redo();
    expect(graph.getNodes()).toHaveLength(0);
  });

  it('keeps records taken before a disable reachable once re-enabled', async () => {
    graph.actions.addNode({});
    graph.historyControls.captureSnapshot();
    await settle();

    graph.historyControls.lifecycle.disable();
    graph.historyControls.lifecycle.enable();

    expect(graph.historyControls.recordCount()).toBe(2);
    graph.historyControls.undo();
    expect(graph.getNodes()).toHaveLength(0);
  });

  it('keeps the current state as the starting point after a clear', async () => {
    graph.actions.addNode({});
    graph.historyControls.captureSnapshot();
    await settle();

    graph.historyControls.clear();

    expect(graph.historyControls.recordCount()).toBe(1);
    expect(graph.historyControls.canUndo()).toBe(false);
    expect(graph.historyControls.canRedo()).toBe(false);
    expect(graph.getNodes()).toHaveLength(1);
  });

  // local storage, a share link and a room all land after the baseline was recorded,
  // and none of them capture a snapshot of their own
  it('starts from state loaded after the baseline rather than the empty graph', async () => {
    const source = setup();
    source.actions.addNode({ id: 'loaded' });
    graph.transit.decode(source.transit.encode());

    graph.historyControls.clear();

    graph.actions.addNode({ id: 'edited' });
    graph.historyControls.captureSnapshot();
    await settle();

    graph.historyControls.undo();
    expect(graph.getNodes().map((node) => node.id)).toEqual(['loaded']);
  });
});
