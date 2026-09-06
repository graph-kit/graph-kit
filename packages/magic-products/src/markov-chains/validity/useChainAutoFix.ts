import colors, { fade } from '@core/utils/colors';
import { generateId } from '@core/utils/id';
import { sum } from '@core/utils/math';
import { GEdge, GNode, Graph } from '@magic/shared/graph';
import Fraction from 'fraction.js';

import { computed } from 'vue';

import { MarkovChain } from '../useMarkovChain.ts';
import { Transition } from './useChainValidity.ts';

// if there is one edge, that edge fix is 1
// if there is multiple edges, sum the total weight and normalize
export const getWeightAdjustments = (
  nodes: Pick<GNode, 'id'>[],
  edges: Transition[],
) => {
  const output = new Map<GEdge['id'], GEdge['weight']>();

  for (const node of nodes) {
    const outboundEdges = edges.filter((e) => e.source === node.id);

    const total = sum(outboundEdges.map((e) => e.weight.abs()));

    if (outboundEdges.length === 0) continue;

    if (outboundEdges.length === 1) {
      const [only] = outboundEdges;
      if (!only.weight.equals(1)) output.set(only.id, new Fraction(1));
      continue;
    }

    // special case where every outbound edge is 0
    if (total.equals(0)) {
      for (const edge of outboundEdges) {
        output.set(edge.id, new Fraction(1 / outboundEdges.length));
      }
      continue;
    }

    for (const edge of outboundEdges) {
      const suggested = edge.weight.abs().div(total);
      if (suggested.equals(edge.weight)) continue;
      output.set(edge.id, suggested);
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
    return edge.weight.equals(0) && !weightAdjustments.value.get(edgeId);
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

  const previewAddedEdges = () =>
    graph.nodes.value
      .filter((n) => graph.helpers.nodes.getOutboundEdges(n.id).length === 0)
      .map((n) => ({
        id: generateId(),
        source: n.id,
        target: n.id,
      }));

  const previewSelLoops = {
    activate: () => {
      graph.phantom.addElements({
        edges: previewAddedEdges().map((e) => ({ ...e, label: '1' })),
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

  const preview = {
    activate: () => {
      edgeTextColor.activate();
      previewSelLoops.activate();
      colorPhantom.activate();
    },
    deactivate: () => {
      edgeTextColor.deactivate();
      previewSelLoops.deactivate();
      colorPhantom.deactivate();
    },
  };

  const handleStructureChange = () => {
    preview.deactivate();
    preview.activate();
  };

  const themer = {
    activate: () => {
      preview.activate();
      graph.rawEvents.subscribe('onStructureChange', handleStructureChange);
    },
    deactivate: () => {
      preview.deactivate();
      graph.rawEvents.unsubscribe('onStructureChange', handleStructureChange);
    },
  };

  return {
    themer,
    apply: () => {
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
        edges: previewAddedEdges(),
        nodes: [],
      });

      graph.history.captureSnapshot();
    },
  };
};
