import { AggregatorTransformer } from '@canvas/primitives/aggregator/types';
import colors from '@core/utils/colors';
import { generateId } from '@core/utils/id';
import { createPhantomAwareEdgeRenderFunction } from '@graph/plugins/phantom/createPhantomAwareEdgeRenderFunction';
import { GraphUnderCursor } from '@graph/plugins/surface/types';
import { CoreEdge } from '@graph/primitives/types';
import { Graph } from '@magic/shared/graph';
import { Lens } from '@magic/shared/lens';
import { LensChipDefinition } from '@magic/shared/ui/lens-chips/types';
import tinycolor from 'tinycolor2';
import { DeepReadonly } from 'ts-essentials';

import { computed } from 'vue';

import { useMstConnected } from './connected.ts';

const MST_COLORS = [
  colors.AMBER_500,
  colors.RED_500,
  colors.BLUE_500,
  colors.GREEN_500,
  colors.EMERALD_600,
  colors.CYAN_500,
  colors.PINK_500,
  colors.ORANGE_500,
  colors.FUCHSIA_500,
  colors.LIME_500,
  colors.ROSE_500,
  colors.PURPLE_500,
  colors.TEAL_500,
];

export const allMstsChip = (graph: Graph): LensChipDefinition => {
  const msts = computed(() => {
    const result = graph.minimumSpanningTrees.all.value;
    return result.skipped ? [] : result.msts;
  });

  const mstConnected = useMstConnected(graph);

  const mstIndexFromId = (edgeId: string) => Number(edgeId.split('-').at(0));
  let activeMstIndex: number | undefined = undefined;

  const noGapRenderer = createPhantomAwareEdgeRenderFunction(graph, {
    parallelEdgeSpacing: 0,
    phantomOnly: true,
    labelled: (edge) => {
      if (msts.value.length < 2) return true;
      const mstIndex = mstIndexFromId(edge.id);
      return mstIndex === activeMstIndex;
    },
  });

  const defaultRenderer = createPhantomAwareEdgeRenderFunction(graph);

  let removeEdges = false;

  const removeNonPhantomEdges: AggregatorTransformer = (agg) => {
    if (!removeEdges) return agg;
    return agg.filter((el) => !graph.isEdge(el.id));
  };
  graph.surface.aggregator.addTransformer(removeNonPhantomEdges);

  const mstIndexToColor = (mstIndex: number) =>
    MST_COLORS[mstIndex % MST_COLORS.length];

  const mstEdgeId = (mstIndex: number) => `${mstIndex}-${generateId()}`;

  const edgeColoring = (edge: CoreEdge) => {
    const mstIndex = mstIndexFromId(edge.id);
    const color = mstIndexToColor(mstIndex);
    if (activeMstIndex !== undefined && activeMstIndex !== mstIndex) {
      return tinycolor(color).setAlpha(0.33).toHex8String();
    }
    return color;
  };

  const edgeThemer = graph.theme.createThemer({
    surface: {
      'edge.default.color': edgeColoring,
      'edge.hover.color': edgeColoring,
      'edge.default.text.color': edgeColoring,
      'edge.hover.text.color': edgeColoring,
    },
  });

  const setActiveMstIndex = ({
    topElement,
  }: DeepReadonly<GraphUnderCursor>) => {
    activeMstIndex = undefined;
    if (!topElement || !graph.phantom.isEdge(topElement.id)) return;
    activeMstIndex = mstIndexFromId(topElement.id);
  };

  const addPhantomEdges = () => {
    for (let mstIndex = 0; mstIndex < msts.value.length; mstIndex++) {
      for (const edge of msts.value[mstIndex]) {
        graph.phantom.addEdge({
          id: mstEdgeId(mstIndex),
          source: edge.source,
          target: edge.target,
          label: edge.weight.toFraction(),
        });
      }
    }
  };

  const MAX_MSTS_EDGE_DEPICTION = 8;

  const lens = {
    id: 'all-msts',
    activate: () => {
      if (msts.value.length > MAX_MSTS_EDGE_DEPICTION) return;
      addPhantomEdges();
      graph.setRenderFunction('edge', noGapRenderer);
      removeEdges = true;
      edgeThemer.activate();
      graph.anchors.lifecycle.disable();
      graph.rawEvents.subscribe('onStructureChange', handleStructureChange);
      graph.surface.events.elements.subscribe(
        'onElementsUnderCursorChange',
        setActiveMstIndex,
      );
    },
    deactivate: () => {
      graph.phantom.removeAllEdges();
      graph.setRenderFunction('edge', defaultRenderer);
      removeEdges = false;
      edgeThemer.deactivate();
      graph.anchors.lifecycle.enable();
      graph.rawEvents.unsubscribe('onStructureChange', handleStructureChange);
      graph.surface.events.elements.unsubscribe(
        'onElementsUnderCursorChange',
        setActiveMstIndex,
      );
    },
  } as const satisfies Lens;

  const handleStructureChange = () => {
    if (msts.value.length > MAX_MSTS_EDGE_DEPICTION) {
      lens.deactivate();
      return;
    }
    graph.phantom.removeAllEdges();
    addPhantomEdges();
  };

  return {
    label: {
      term: 'Unique MSTs',
      value: () => msts.value.length,
    },
    disabled: () => {
      if (graph.minimumSpanningTrees.all.value.skipped) {
        return { reason: 'Too many nodes' };
      }
      return false;
    },
    tooltipLabel: () => {
      const count = msts.value.length;
      const noun = mstConnected.value
        ? 'minimum spanning tree'
        : 'minimum spanning forest';
      return `This graph has ${count} unique ${noun}${count === 1 ? '' : 's'}.`;
    },
    lens,
  };
};
