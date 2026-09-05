import colors, { fade } from '@core/utils/colors';
import { generateId } from '@core/utils/id';
import { sum } from '@core/utils/math';
import { GEdge, GNode, Graph } from '@magic/shared/graph';
import Fraction from 'fraction.js';

import { computed } from 'vue';

import { MarkovChain } from './useMarkovChain.ts';

// if total outgoing is 1, it's valid, no fix
// if total outgoing is != 1:
// if there is one edge, that edge fix is 1
// if there is multiple edges, sum the total weight and normalize
const getWeightAdjustments = (nodes: GNode[], edges: GEdge[]) => {
  const output = new Map<GEdge['id'], GEdge['weight']>();

  for (const node of nodes) {
    const outboundEdges = edges.filter((e) => e.source === node.id);

    const total = sum(outboundEdges.map((e) => e.weight.abs()));
    if (total.equals(1)) continue;

    if (outboundEdges.length === 0) continue;

    if (outboundEdges.length === 1) {
      output.set(outboundEdges[0].id, new Fraction(1));
      continue;
    }

    for (const edge of outboundEdges) {
      const absWeight = edge.weight.abs();
      const suggested = absWeight.div(total);
      if (suggested.equals(absWeight)) continue;
      output.set(edge.id, absWeight.div(total));
    }
  }

  return output;
};

const ADD_REMOVE_PREVIEW_OPACITY = 0.35;

export const useChainAutoFix = (graph: Graph, chain: MarkovChain) => {
  const weightAdjustments = computed(() => {
    return getWeightAdjustments(graph.nodes.value, graph.edges.value);
  });

  const previewContentWeightFix = ({ id: edgeId }: { id: string }) => {
    return weightAdjustments.value.get(edgeId)?.toFraction();
  };

  const toBeRemoved = (edgeId: string) => {
    if (!graph.isEdge(edgeId)) return false;
    const edge = graph.getEdge(edgeId);
    return edge.weight.equals(0);
  };

  const previewWeightColorFix = (
    { id: edgeId }: { id: string },
    underneath: () => string,
  ) => {
    if (toBeRemoved(edgeId))
      return fade(underneath(), ADD_REMOVE_PREVIEW_OPACITY);
    return weightAdjustments.value.has(edgeId) ? colors.AMBER_500 : undefined;
  };

  const previewEdgeRemoval = (
    { id: edgeId }: { id: string },
    underneath: () => string,
  ) => {
    if (toBeRemoved(edgeId))
      return fade(underneath(), ADD_REMOVE_PREVIEW_OPACITY);
  };

  const edgeTextColor = graph.theme.createThemer({
    surface: {
      'edge.default.text.content': previewContentWeightFix,
      'edge.default.text.color': previewWeightColorFix,
      'edge.default.color': previewEdgeRemoval,
    },
    focus: {
      'edge.focus.text.content': previewContentWeightFix,
      'edge.focus.text.color': previewWeightColorFix,
      'edge.focus.color': previewEdgeRemoval,
    },
  });

  const previewAddedEdges = computed(() => {
    return graph.nodes.value
      .filter((n) => graph.helpers.nodes.getOutboundEdges(n.id).length === 0)
      .map((n) => ({
        id: generateId(),
        source: n.id,
        target: n.id,
      }));
  });

  const previewSelLoops = {
    activate: () => {
      graph.phantom.addElements({
        edges: previewAddedEdges.value.map((e) => ({ ...e, label: '1' })),
        nodes: [],
      });
    },
    deactivate: () => {
      graph.phantom.removeAllEdges();
    },
  };

  const fadePhantom = (
    { id: edgeId }: { id: string },
    underneath: () => string,
  ) => {
    if (graph.phantom.isEdge(edgeId)) {
      return fade(underneath(), ADD_REMOVE_PREVIEW_OPACITY);
    }
  };

  const colorPhantom = graph.theme.createThemer({
    surface: {
      'edge.default.text.color': fadePhantom,
      'edge.default.color': fadePhantom,
    },
    focus: {
      'edge.focus.text.color': fadePhantom,
      'edge.focus.color': fadePhantom,
    },
  });

  const themer = {
    activate: () => {
      edgeTextColor.activate();
      previewSelLoops.activate();
      colorPhantom.activate();
      graph.rawEvents.subscribe('onStructureChange', handleStructureChange);
    },
    deactivate: () => {
      edgeTextColor.deactivate();
      previewSelLoops.deactivate();
      colorPhantom.deactivate();
      graph.rawEvents.unsubscribe('onStructureChange', handleStructureChange);
    },
  };

  const handleStructureChange = () => {
    themer.deactivate();
    themer.activate();
  };

  return {
    themer,
    apply: () => {
      themer.deactivate();
      graph.weights.setMany(
        Array.from(weightAdjustments.value).map(([edgeId, weight]) => ({
          edgeId,
          update: weight,
        })),
      );

      graph.actions.removeElements({
        edges: graph.edges.value.filter((e) => e.weight.equals(0)),
        nodes: [],
      });

      graph.actions.addElements({
        edges: previewAddedEdges.value,
        nodes: [],
      });
    },
  };
};
