import { Graph } from '../graph/types.ts';
import { useGraph } from '../graph/useGraph.ts';
import { resolveShellFlags } from '../product/flags.ts';
import { ContentPredicate, ProductControls, Shell } from '../product/types.ts';
import { useShell } from '../product/useShell.ts';
import { provideGraph } from './context.ts';
import { graphShellHelpMenu } from './help.ts';
import { bindGraphToDoc } from './multiplayer/bindGraphToDoc.ts';
import { trackDraggedNodes } from './multiplayer/trackDraggedNodes.ts';
import { GRAPH_ONBOARDING } from './onboarding.ts';
import { useGraphShellShortcuts } from './shortcuts.ts';
import { graphTransitCompression } from './transit-compression.ts';
import { GraphShellOptions } from './types.ts';

/** adapts a graph to the shell's controls interface, see {@link useShell} */
export const useGraphShell = (
  options: GraphShellOptions,
): { shell: Shell; graph: Graph } => {
  const graph = useGraph(options);

  const lensChips = options.lensChips?.(graph);
  const simulationButtons = options.simulationButtons?.(graph);

  const draggedNodes = trackDraggedNodes(graph);

  const isContent: ContentPredicate = ({ id }) =>
    graph.isNode(id) || graph.isEdge(id);

  const flags = resolveShellFlags(options.flags, {
    transit: { ...graph.transit, compression: graphTransitCompression },
    isContent,
  });

  if (!flags.history) graph.history.lifecycle.disable();
  if (!flags.annotations) graph.annotations.lifecycle.disable();

  const host: ProductControls = {
    surface: graph.surface,
    transit: { ...graph.transit, compression: graphTransitCompression },
    annotations: flags.annotations ? graph.annotations : undefined,
    history: flags.history ? graph.history : undefined,
    isContent,
    onAppearanceChanged: (color) =>
      (graph.theme.activePresetName.value = color),
    multiplayer: {
      bind: (doc, mode) =>
        bindGraphToDoc(graph, doc, mode, draggedNodes.isDragging),
      drag: draggedNodes.events,
      tiers: {
        host: {},
        admin: {},
        write: {},
        read: {
          enter: graph.readonly.enter,
          exit: graph.readonly.exit,
        },
      },
    },
  };

  const shell = useShell(host, {
    productId: options.productId,
    flags: options.flags,
    helpMenu: graphShellHelpMenu(graph, options.helpMenu),
    lensChips,
    simulationButtons,
    onboarding: flags.onboarding ? GRAPH_ONBOARDING : [],
    onSetupCompleted: () => {
      if (graph.nodes.value.length > 0) shell.onboarding?.close();
    },
  });

  // the first node is the prompt answered
  graph.events.subscribe('onStructureChange', () => shell.onboarding?.close());

  graph.events.subscribe('onStructureChange', shell.simulation.invalidate);

  graph.events.subscribe('onStructureChange', shell.localStorage.invalidate);
  graph.annotations.events.subscribe(
    'onAnnotationsChanged',
    shell.localStorage.invalidate,
  );

  graph.events.subscribe(
    'onNodePositionsCommitted',
    shell.localStorage.invalidate,
  );

  shell.simulation.events.subscribe('onSimulationStarted', graph.focus.clear);

  useGraphShellShortcuts(shell, graph);

  provideGraph(graph);

  return {
    graph,
    shell,
  };
};
