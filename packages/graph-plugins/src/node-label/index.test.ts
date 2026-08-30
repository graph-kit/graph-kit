import { PluginOptions } from '@graph/plugins-shared/plugins';
import { describe, expect, it } from 'vitest';

import { nodeLabel } from './index.ts';
import { NodeLabelPlugin } from './types.ts';

/** only the theme layer and the node list are read, and neither is what is under test */
const stubOptions = () =>
  ({
    controls: {
      nodes: () => [],
      surface: {
        theme: { createLayer: () => ({ set: () => {}, removeAll: () => {} }) },
      },
    },
    actions: {},
    getters: {},
    events: {},
  }) as unknown as PluginOptions<NodeLabelPlugin>;

const setup = () => nodeLabel(stubOptions());

describe('nodeLabel transit', () => {
  it('replaces what it holds rather than merging onto it', () => {
    const plugin = setup();
    plugin.controls.setMany([{ nodeId: 'gone999', label: 'A' }]);

    plugin.transit.decode([{ nodeId: 'here111', label: 'B' }]);

    expect(plugin.transit.encode()).toEqual([
      { nodeId: 'here111', label: 'B' },
    ]);
  });

  it('leaves nothing behind when it decodes an empty graph', () => {
    const plugin = setup();
    plugin.controls.setMany([{ nodeId: 'gone999', label: 'A' }]);

    plugin.transit.decode([]);

    expect(plugin.transit.encode()).toEqual([]);
  });

  it('round trips the labels it was given', () => {
    const plugin = setup();
    const labels = [
      { nodeId: 'aaa1111', label: 'A' },
      { nodeId: 'bbb2222', label: 'B' },
    ];

    plugin.transit.decode(labels);

    expect(plugin.transit.encode()).toEqual(labels);
  });
});
