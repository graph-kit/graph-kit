import { nullThrows } from '@core/utils/assert';
import { Color } from '@core/utils/colors';
import { CoreEdge } from '@graph/primitives/types';
import { GNode } from '@magic/shared/graph';
import { Lens } from '@magic/shared/lens';
import { MagicGraph } from '@magic/shared/product';
import { SimulationGuardBuilder } from '@magic/shared/simulation';
import type {
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

import Considering from './components/Considering.vue';
import Excluded from './components/Excluded.vue';
import Unexplored from './components/Unexplored.vue';
import { kruskalsExplainer, primsExplainer } from './explainer.ts';
import { KruskalsFrame, KruskalsFunction, PrimsFrame, PrimsFunction } from './frame.ts';

// exploring = the tree side node the current decision is anchored to, plus
//   both endpoints of the edge just selected, so the edge and the node it's
//   about to add to the tree read as one event
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

export const primsSlotIds = {
  unexplored: 'min-spanning-trees/prims/unexplored',
  considering: 'min-spanning-trees/prims/considering',
  excluded: 'min-spanning-trees/prims/excluded',
} as const;

export type StartNodeId = Ref<GNode['id'] | undefined>;

export type PrimsSimulationOptions = {
  graph: MagicGraph;
  startNodeId: StartNodeId;
};

// shared by both algorithms: an edge ruled out (closes a loop) fades instead
// of disappearing, so it stays visible as "seen and rejected"
const createExcludedEdgeThemer = (graph: MagicGraph) => {
  const excludedIds = new Set<string>();
  const fadeExcluded = (edge: CoreEdge, resolveUnderneath: () => Color) => {
    if (!excludedIds.has(edge.id)) return;
    // TODO: does this have a default constant somewhere?
    return tinycolor(resolveUnderneath()).setAlpha(0.25).toHex8String();
  };
  const themer = graph.theme.createThemer({
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

  return {
    themer,
    setIds: (ids: readonly string[]) => {
      excludedIds.clear();
      for (const id of ids) excludedIds.add(id);
    },
  };
};

const primsEffects = (graph: MagicGraph): SimulationEffects<PrimsFrame> => {
  const frontier = createNodeIdThemer(graph, nodeRoles.frontier);
  const settled = createNodeIdThemer(graph, nodeRoles.settled);
  const anchor = createNodeIdThemer(graph, nodeRoles.anchor);
  const exploring = createNodeIdThemer(graph, nodeRoles.exploring);

  const tree = createEdgeIdThemer(graph, edgeRoles.tree);
  const candidateEdge = createEdgeIdThemer(graph, edgeRoles.candidate);
  const crossingEdge = createEdgeIdThemer(graph, edgeRoles.crossing);
  const excludedEdge = createExcludedEdgeThemer(graph);

  const themers = [
    frontier,
    settled,
    anchor,
    exploring,
    tree,
    candidateEdge,
    crossingEdge,
    excludedEdge,
  ];

  const syncToFrame = (frame: PrimsFrame) => {
    const selectedEdgeEndpoints = frame.selectedEdge
      ? [graph.getEdge(frame.selectedEdge).source, graph.getEdge(frame.selectedEdge).target]
      : [];

    exploring.setIds(
      frame.activeNodeId ? [frame.activeNodeId, ...selectedEdgeEndpoints] : selectedEdgeEndpoints,
    );
    settled.setIds(frame.treeNodeIds);
    frontier.setIds(frame.pendingNodeIds ?? []);
    anchor.setId(frame.anchorNodeId);
    tree.setIds(frame.treeEdgeIds);
    candidateEdge.setIds(frame.candidateEdges ?? []);
    crossingEdge.setIds(frame.selectedEdge ? [frame.selectedEdge] : []);
    excludedEdge.setIds(frame.excludedEdgeIds);
  };

  const lens: Lens = {
    id: 'min-spanning-trees/prims',
    components: [
      { component: Unexplored, position: 'center-left', id: primsSlotIds.unexplored },
      { component: Excluded, position: 'center-left', id: primsSlotIds.excluded },
      { component: Considering, position: 'center-right', id: primsSlotIds.considering },
    ],
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
    .custom(() => {
      if (options.graph.edges.value.length < 1) {
        return { id: 'no-edges' };
      }
    })
    .minNodes(2).build(),
  collectFrames: (collector) => {
    prims(
      options.graph,
      nullThrows(options.startNodeId.value, 'start node id not defined'),
    )(collector);
  },
  setup: () => primsEffects(options.graph),
});

// active = the endpoints of the edge currently under consideration
// settled = already grown into the tree
type KruskalsNodeConcept = 'active' | 'settled';

const kruskalsNodeRoles = {
  active: 'active',
  settled: 'settled',
} as const satisfies Record<KruskalsNodeConcept, NodeRole>;

// crossing = the edge currently under consideration
// tree = an edge accepted into the tree so far
type KruskalsEdgeConcept = 'crossing' | 'tree';

const kruskalsEdgeRoles = {
  crossing: 'crossing',
  tree: 'tree',
} as const satisfies Record<KruskalsEdgeConcept, EdgeRole>;

export type KruskalsSimulationOptions = {
  graph: MagicGraph;
};

const kruskalsEffects = (
  graph: MagicGraph,
): SimulationEffects<KruskalsFrame> => {
  const active = createNodeIdThemer(graph, kruskalsNodeRoles.active);
  const settled = createNodeIdThemer(graph, kruskalsNodeRoles.settled);

  const tree = createEdgeIdThemer(graph, kruskalsEdgeRoles.tree);
  const crossingEdge = createEdgeIdThemer(graph, kruskalsEdgeRoles.crossing);
  const excludedEdge = createExcludedEdgeThemer(graph);

  const themers = [active, settled, tree, crossingEdge, excludedEdge];

  const syncToFrame = (frame: KruskalsFrame) => {
    active.setIds(frame.activeNodeIds ?? []);
    settled.setIds(frame.treeNodeIds);
    tree.setIds(frame.treeEdgeIds);
    crossingEdge.setId(frame.activeEdgeId);
    excludedEdge.setIds(frame.excludedEdgeIds);
  };

  const lens: Lens = {
    id: 'min-spanning-trees/kruskals',
    activate: () => {
      for (const { themer } of themers) themer.activate();
    },
    deactivate: () => {
      for (const { themer } of themers) themer.deactivate();
    },
  };

  return {
    lens,
    explainer: kruskalsExplainer(graph),
    onSetupCompleted: syncToFrame,
    onFrameTransition: syncToFrame,
    onViolation: graph.magic.simulation.stop,
  };
};

export const kruskalsSimulationDefinition = (
  kruskals: KruskalsFunction,
  options: KruskalsSimulationOptions,
): SimulationDefinition<KruskalsFrame> => ({
  guard: new SimulationGuardBuilder(options.graph).minNodes(2).custom(() => {
      if (options.graph.edges.value.length < 1) {
        return { id: 'no-edges' };
      }
    }).build(),
  collectFrames: (collector) => {
    kruskals(options.graph)(collector);
  },
  setup: () => kruskalsEffects(options.graph),
});
