import { nullThrows } from '@core/utils/assert';
import { Color } from '@core/utils/colors';
import { CoreEdge } from '@graph/primitives/types';
import { GNode } from '@magic/shared/graph';
import { Lens } from '@magic/shared/lens';
import { MagicGraph } from '@magic/shared/product/useGraphProduct';
import { SimulationGuardBuilder } from '@magic/shared/simulation';
import {
  SimulationDefinition,
  SimulationEffects,
} from '@magic/shared/simulation/types';
import {
  EdgeRole,
  NodeRole,
  createEdgeIdThemer,
  createNodeIdThemer,
} from '@magic/shared/theme';
import tinycolor from 'tinycolor2';

import { Ref } from 'vue';

import { primsExplainer } from './explainer.ts';
import { PrimsFrame, PrimsFunction } from './frame.ts';

// exploring = the tree side node the current decision is anchored to 
// settled = already grown into the tree
// frontier = the far side of a potential edge 
// anchor = start node (user picked)
type PrimsNodeConcept = 'exploring' | 'settled' | 'frontier' | 'anchor';

const nodeRoles = {
  exploring: 'active',
  settled: 'settled',
  frontier: 'candidate',
  anchor: 'anchor',
} as const satisfies Record<PrimsNodeConcept, NodeRole>;

// candidate = a currently eligible edge,
// crossing = the one or two edges being weighed against each other right now
// tree = an edge grown into the tree so far
type PrimsEdgeConcept = 'candidate' | 'crossing' | 'tree';

const edgeRoles = {
  candidate: 'weighing',
  crossing: 'crossing',
  tree: 'tree',
} as const satisfies Record<PrimsEdgeConcept, EdgeRole>;

export type StartNodeId = Ref<GNode['id'] | undefined>;

export type PrimsSimulationOptions = {
  graph: MagicGraph;
  startNodeId: StartNodeId;
};

const primsEffects = (graph: MagicGraph): SimulationEffects<PrimsFrame> => {
  const frontier = createNodeIdThemer(graph, nodeRoles.frontier);
  const settled = createNodeIdThemer(graph, nodeRoles.settled);
  const anchor = createNodeIdThemer(graph, nodeRoles.anchor);
  const exploring = createNodeIdThemer(graph, nodeRoles.exploring);

  const tree = createEdgeIdThemer(graph, edgeRoles.tree);
  const candidateEdge = createEdgeIdThemer(graph, edgeRoles.candidate);
  const crossingEdge = createEdgeIdThemer(graph, edgeRoles.crossing);

  const excludedIds = new Set<string>();
  const fadeExcluded = (edge: CoreEdge, resolveUnderneath: () => Color) => {
    if (!excludedIds.has(edge.id)) return;
    // TODO: does this have a default constant somewhere?
    return tinycolor(resolveUnderneath()).setAlpha(0.25).toHex8String();
  };
  const excludedEdge = graph.theme.createThemer({
    canvas: {
      'edge.default.color': fadeExcluded,
      'edge.default.text.color': fadeExcluded,
      'edge.hover.color': fadeExcluded,
      'edge.hover.text.color': fadeExcluded,
    },
    focus: {
      'edge.focus.color': fadeExcluded,
      'edge.focus.text.color': fadeExcluded,
    },
  });

  const themers = [
    frontier,
    settled,
    anchor,
    exploring,
    tree,
    candidateEdge,
    crossingEdge,
    { themer: excludedEdge },
  ];

  const syncToFrame = (frame: PrimsFrame) => {
    exploring.setId(frame.activeNodeId);
    settled.setIds(frame.treeNodeIds);
    frontier.setIds(frame.pendingNodeIds ?? []);
    anchor.setId(frame.anchorNodeId);
    tree.setIds(frame.treeEdgeIds);
    candidateEdge.setIds(frame.candidateEdges ?? []);
    crossingEdge.setIds([
      ...(frame.currentComparison ?? []),
      ...(frame.selectedEdge ? [frame.selectedEdge] : []),
    ]);
    excludedIds.clear();
    for (const id of frame.excludedEdgeIds) excludedIds.add(id);
  };

  const lens: Lens = {
    id: 'min-spanning-trees/prims',
    activate: () => {
      for (const { themer } of themers) themer.activate();
    },
    deactivate: () => {
      for (const { themer } of themers) themer.deactivate();
    },
  };

  return {
    lens,
    explainer: primsExplainer(graph),
    onSetupCompleted: syncToFrame,
    onFrameTransition: syncToFrame,
    onViolation: graph.magic.simulation.stop,
  };
};

export const primsSimulationDefinition = (
  prims: PrimsFunction,
  options: PrimsSimulationOptions,
): SimulationDefinition<PrimsFrame> => ({
  guard: new SimulationGuardBuilder(options.graph)
    .custom(() => {
      const startNodeInNodes = options.graph.nodes.value.some(
        (node) => node.id === options.startNodeId.value,
      );
      if (startNodeInNodes) return;
      return { id: 'no-start-node' };
    })
    .build(),
  collectFrames: (collector) => {
    prims(
      options.graph,
      nullThrows(options.startNodeId.value, 'start node id not defined'),
    )(collector);
  },
  setup: () => primsEffects(options.graph),
});
