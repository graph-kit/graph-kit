import { MaybeGetter, getValue } from '@core/utils/maybeGetter/index';

import { Ref, ref } from 'vue';

import { Graph } from '../graph/types.ts';
import { HelpMenuItem } from '../ui/help-menu/types.ts';

type PluginLifecycle = Graph['interactive']['lifecycle'];

export const GRAPH_HELP_CATEGORY = 'Graph';

const INTERACTIVE_HELP: HelpMenuItem[] = [
  {
    id: 'graph/add-node',
    category: GRAPH_HELP_CATEGORY,
    name: 'Add Node',
    gesture: 'dblclick',
  },
  {
    id: 'graph/remove-node',
    category: GRAPH_HELP_CATEGORY,
    name: 'Remove Node',
    key: 'backspace',
  },
];

const lifecycleEnabled = (lifecycle: PluginLifecycle): Ref<boolean> => {
  const enabled = ref(lifecycle.isEnabled());
  lifecycle.events.subscribe('onEnabled', () => (enabled.value = true));
  lifecycle.events.subscribe('onDisabled', () => (enabled.value = false));
  return enabled;
};

/** the graph's gestures and the product's, listed only while a plugin answers them */
export const graphShellHelpMenu = (
  graph: Graph,
  productHelp: MaybeGetter<HelpMenuItem[]> = [],
) => {
  const interactive = lifecycleEnabled(graph.interactive.lifecycle);

  return () => [
    ...(interactive.value ? INTERACTIVE_HELP : []),
    ...getValue(productHelp),
  ];
};
