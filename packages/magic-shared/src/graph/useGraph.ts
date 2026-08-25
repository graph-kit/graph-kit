import { CoreOptions } from '@graph/core/options';
import { createGraph } from '@graph/create-graph/index';
import { adjacencyLists } from '@graph/plugins/adjacency-lists/index';
import { anchors } from '@graph/plugins/anchors/index';
import { animation } from '@graph/plugins/animation/index';
import { annotations } from '@graph/plugins/annotations/index';
import { characteristics } from '@graph/plugins/characteristics/index';
import { focus } from '@graph/plugins/focus/index';
import { history } from '@graph/plugins/history/index';
import { interactive } from '@graph/plugins/interactive/index';
import { InteractiveOptions } from '@graph/plugins/interactive/options';
import { marquee } from '@graph/plugins/marquee/index';
import { minimumSpanningTrees } from '@graph/plugins/minimum-spanning-trees/index';
import { MinimumSpanningTreesOptions } from '@graph/plugins/minimum-spanning-trees/options';
import { nodeDrag } from '@graph/plugins/node-drag/index';
import { NodeDragOptions } from '@graph/plugins/node-drag/options';
import { nodeLabel } from '@graph/plugins/node-label/index';
import { createPhantomAwareEdgeRenderFunction } from '@graph/plugins/phantom/createPhantomAwareEdgeRenderFunction';
import { phantom } from '@graph/plugins/phantom/index';
import { readonly } from '@graph/plugins/readonly/index';
import { surface } from '@graph/plugins/surface/index';
import { transitionMatrix } from '@graph/plugins/transition-matrix/index';
import { dark } from '@graph/theme-presets/dark/index';
import { light } from '@graph/theme-presets/light/index';
import { useAdjacencyLists } from '@graph/vue/useAdjacencyLists';
import { useAnimation } from '@graph/vue/useAnimation';
import { useCharacteristics } from '@graph/vue/useCharacteristics';
import { useCreateGraphActivePreset } from '@graph/vue/useCreateGraphActivePreset';
import { useFocus } from '@graph/vue/useFocus';
import { useGraphEvents } from '@graph/vue/useGraphEvents';
import { useHistory } from '@graph/vue/useHistory';
import { useMinimumSpanningTrees } from '@graph/vue/useMinimumSpanningTrees';
import { useNodesEdges } from '@graph/vue/useNodesEdges';
import { useTransitionMatrix } from '@graph/vue/useTransitionMatrix';

import { useGraphDevTools } from './useGraphDevTools.ts';

export type UseGraphOptions = {
  core?: Partial<CoreOptions>;
  interactive?: Partial<InteractiveOptions>;
  nodeDrag?: Partial<NodeDragOptions>;
  minimumSpanningTrees?: Partial<MinimumSpanningTreesOptions>;
};

const graphPlugins = (options: UseGraphOptions) => [
  surface,
  history,
  focus,
  marquee,
  anchors,
  annotations,
  nodeDrag(options.nodeDrag ?? {}),
  nodeLabel,
  adjacencyLists,
  transitionMatrix,
  characteristics,
  interactive(options.interactive ?? {}),
  animation,
  phantom,
  minimumSpanningTrees(options.minimumSpanningTrees ?? {}),
  readonly,
];

const createGraphWithPlugins = (options: UseGraphOptions) => {
  const graph = createGraph({
    coreOptions: options.core ?? {},
    plugins: graphPlugins(options),
    themePresets: {
      dark,
      light,
    },
  });
  const edgeRenderer = createPhantomAwareEdgeRenderFunction(graph);
  graph.setRenderFunction('edge', edgeRenderer);
  return graph;
};

export const useGraph = (options: UseGraphOptions = {}) => {
  const graph = createGraphWithPlugins(options);

  useGraphDevTools(graph);

  const vueActivePreset = useCreateGraphActivePreset(graph.theme);
  const vueNodesEdges = useNodesEdges(graph);
  const vueAdjacencyLists = useAdjacencyLists(graph.adjacencyLists);
  const vueCharacteristics = useCharacteristics(graph.characteristics);
  const vueTransitionMatrix = useTransitionMatrix(graph.transitionMatrix);
  const vueMinimumSpanningTrees = useMinimumSpanningTrees(
    graph.minimumSpanningTrees,
  );
  const vueFocus = useFocus(graph.focus);
  const vueHistory = useHistory(graph.history);
  const vueAnimation = useAnimation(graph.animation);

  const vueEvents = useGraphEvents(graph.events);

  return {
    ...graph,
    ...vueNodesEdges,
    adjacencyLists: vueAdjacencyLists,
    characteristics: vueCharacteristics,
    transitionMatrix: vueTransitionMatrix,
    minimumSpanningTrees: vueMinimumSpanningTrees,
    focus: vueFocus,
    history: vueHistory,
    animation: vueAnimation,
    theme: {
      ...graph.theme,
      ...vueActivePreset,
    },
    events: vueEvents,
    rawEvents: graph.events,
  };
};
