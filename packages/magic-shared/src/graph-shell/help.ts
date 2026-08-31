import { MaybeGetter, getValue } from '@core/utils/maybeGetter/index';

import { Ref, ref } from 'vue';

import { Graph } from '../graph/types.ts';
import { HelpMenuGesture } from '../ui/help-menu/types.ts';

type PluginLifecycle = Graph['interactive']['lifecycle'];

/** the group the graph's own entries read under, shared so the two never drift apart */
export const GRAPH_HELP_CATEGORY = 'Graph';

/** what a double click on the canvas does, which the interactive plugin is what answers */
const INTERACTIVE_GESTURES: HelpMenuGesture[] = [
  {
    id: 'graph/add-node',
    category: GRAPH_HELP_CATEGORY,
    name: 'Add Node',
    gesture: 'dblclick',
  },
];

const lifecycleEnabled = (lifecycle: PluginLifecycle): Ref<boolean> => {
  const enabled = ref(lifecycle.isEnabled());
  lifecycle.events.subscribe('onEnabled', () => (enabled.value = true));
  lifecycle.events.subscribe('onDisabled', () => (enabled.value = false));
  return enabled;
};

/**
 * the graph's gestures and the product's, as one list the menu re-reads. interactive is
 * what turns a double click into a node, and readonly suppresses it inside a room, so
 * the row is listed only while something is there to answer it
 */
export const graphShellHelpMenu = (
  graph: Graph,
  productGestures: MaybeGetter<HelpMenuGesture[]> = [],
) => {
  const interactive = lifecycleEnabled(graph.interactive.lifecycle);

  return () => [
    ...(interactive.value ? INTERACTIVE_GESTURES : []),
    ...getValue(productGestures),
  ];
};
