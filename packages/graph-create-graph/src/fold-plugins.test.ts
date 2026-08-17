import { core } from '@graph/core/index';
import { LooseGraphPlugin } from '@graph/plugins-shared/plugins';
import { ReactiveMap, reactiveMap } from '@reactive/primitives/index';
import { describe, expect, it, vi } from 'vitest';

import { foldPlugins } from './fold-plugins.ts';

// mimics real plugins like node-label: wraps addNode by calling the inbound
// action first, then mutating its own local state afterward, outside any
// core transaction. this is exactly the shape that made the original bug
// possible (onNodesAdded firing before the label existed).
const createLabelingPlugin =
  (nodeIdToLabel: Map<string, string>): LooseGraphPlugin =>
  ({ events, actions, getters }) => ({
    name: 'labeling',
    controls: {},
    events,
    getters,
    actions: {
      ...actions,
      addNode: (options: any) => {
        const node = actions.addNode(options);
        if (!node) return undefined;
        nodeIdToLabel.set(node.id, `label-${node.id}`);
        return node;
      },
    },
  });

// mimics the interactive plugin: doesn't extend the action pipeline, just
// captures a reference at fold time to call later, in response to something
// external (here, a manually-invoked callback instead of a real click).
const createTriggeringPlugin =
  (onReady: (trigger: () => any) => void): LooseGraphPlugin =>
  ({ actions, finalActions, events, getters }) => {
    onReady(() => finalActions.addNode({}));

    return {
      name: 'triggering',
      controls: {},
      events,
      getters,
      actions,
    };
  };

// mimics nodeLabel: decorates getNode with plugin-local state held in a reactive
// container, which is the whole contract. no invalidation call anywhere.
const createLabelingGetterPlugin =
  (nodeIdToLabel: ReactiveMap<string, string>): LooseGraphPlugin =>
  ({ events, actions, getters }) => ({
    name: 'labelingGetter',
    controls: {
      setLabel: (id: string, label: string) => {
        nodeIdToLabel.set(id, label);
      },
    },
    events,
    getters: {
      ...getters,
      getNode: (id: string) => ({
        ...getters.getNode(id),
        label: nodeIdToLabel.get(id) ?? '?',
      }),
    },
    actions: {
      ...actions,
      addNode: (options: any) => {
        const node = actions.addNode(options);
        if (!node) return undefined;
        nodeIdToLabel.set(node.id, `label-${node.id}`);
        return node;
      },
    },
  });

describe('finalActions', () => {
  it('resolves to the fully-composed action, unlike a captured `actions` snapshot', () => {
    const nodeIdToLabel = reactiveMap<string, string>();
    let trigger: (() => any) | undefined;

    const folded = foldPlugins(
      core({}),
      [
        createLabelingPlugin(nodeIdToLabel),
        createTriggeringPlugin((t) => (trigger = t)),
      ],
      {},
      () => 'default',
    );

    let labelAtEmitTime: string | undefined;
    folded.events.subscribe('onNodesAdded', (nodes) => {
      labelAtEmitTime = nodeIdToLabel.get(nodes[0].id);
    });

    // invoked well after folding completes, exactly like a real click handler
    const node = trigger!();

    expect(labelAtEmitTime).toBe(`label-${node.id}`);
  });
});

describe('foldPlugins structural events', () => {
  it('fires onNodesAdded only after the fully-composed action finishes', () => {
    const nodeIdToLabel = reactiveMap<string, string>();
    const folded = foldPlugins(
      core({}),
      [createLabelingPlugin(nodeIdToLabel)],
      {},
      () => 'default',
    );

    let labelAtEmitTime: string | undefined;
    folded.events.subscribe('onNodesAdded', (nodes) => {
      labelAtEmitTime = nodeIdToLabel.get(nodes[0].id);
    });

    const node = folded.actions.addNode({});

    expect(labelAtEmitTime).toBe(`label-${node.id}`);
  });

  it('fires onStructureChange exactly once per structural action', () => {
    const folded = foldPlugins(core({}), [], {}, () => 'default');

    const onStructureChange = vi.fn();
    folded.events.subscribe('onStructureChange', onStructureChange);

    folded.actions.addNode({});

    expect(onStructureChange).toHaveBeenCalledTimes(1);
  });

  it('does not fire structural events when nothing changed', () => {
    const folded = foldPlugins(core({}), [], {}, () => 'default');

    const onNodesAdded = vi.fn();
    const onStructureChange = vi.fn();
    folded.events.subscribe('onNodesAdded', onNodesAdded);
    folded.events.subscribe('onStructureChange', onStructureChange);

    // an empty bulk add is a no-op: nothing was actually added
    folded.actions.addElements({ nodes: [], edges: [] } as any);

    expect(onNodesAdded).not.toHaveBeenCalled();
    expect(onStructureChange).not.toHaveBeenCalled();
  });

  it('derives onStructureChange from edge weight commits, independent of action wrapping', () => {
    const folded = foldPlugins(core({}), [], {}, () => 'default');

    const nodeA = folded.actions.addNode({});
    const nodeB = folded.actions.addNode({});
    const edge = folded.actions.addEdge({
      source: nodeA.id,
      target: nodeB.id,
    } as any);

    const onStructureChange = vi.fn();
    folded.events.subscribe('onStructureChange', onStructureChange);

    // weight is set directly on controls, bypassing the wrapped actions entirely
    folded.controls.weights.set({ edgeId: edge.id, update: 5 as any });

    expect(onStructureChange).toHaveBeenCalledTimes(1);
  });
});

describe('nodes and edges', () => {
  it('reads empty right after folding, with no priming step', () => {
    const folded = foldPlugins(core({}), [], {}, () => 'default');

    expect(folded.getNodes()).toEqual([]);
    expect(folded.getEdges()).toEqual([]);
  });

  it('tracks structural changes with no invalidation wiring', () => {
    const folded = foldPlugins(core({}), [], {}, () => 'default');

    const node = folded.actions.addNode({});

    expect(folded.getNodes().map((n: any) => n.id)).toContain(node.id);
  });

  it('tracks a plugin-local state change through the reactive container', () => {
    const nodeIdToLabel = reactiveMap<string, string>();
    const folded = foldPlugins(
      core({}),
      [createLabelingGetterPlugin(nodeIdToLabel)],
      {},
      () => 'default',
    );

    const node = folded.actions.addNode({});
    (folded.controls as any).labelingGetter.setLabel(node.id, 'renamed');

    const found = folded.getNodes().find((n: any) => n.id === node.id) as any;
    expect(found.label).toBe('renamed');
  });

  // the read is synchronous, not scheduled. a computed evaluates when it is read, so
  // there is no flush to await and no window where a caller can observe stale data
  it('reflects every write immediately, without awaiting a flush', () => {
    const nodeIdToLabel = reactiveMap<string, string>();
    const folded = foldPlugins(
      core({}),
      [createLabelingGetterPlugin(nodeIdToLabel)],
      {},
      () => 'default',
    );

    const node = folded.actions.addNode({});
    const labeling = (folded.controls as any).labelingGetter;

    const labelNow = () =>
      (folded.getNodes().find((n: any) => n.id === node.id) as any).label;

    labeling.setLabel(node.id, 'a');
    expect(labelNow()).toBe('a');

    labeling.setLabel(node.id, 'b');
    labeling.setLabel(node.id, 'c');
    expect(labelNow()).toBe('c');
  });

  it('does not recompute when nothing it depends on changed', () => {
    const folded = foldPlugins(core({}), [], {}, () => 'default');
    folded.actions.addNode({});

    expect(folded.getNodes()).toBe(folded.getNodes());
  });
});
