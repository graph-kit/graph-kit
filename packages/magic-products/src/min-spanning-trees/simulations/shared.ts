import { nullThrows } from '@core/utils/assert';
import colors, { Color } from '@core/utils/colors';
import { CoreEdge } from '@graph/primitives/types';
import { GEdge, GNode, Graph } from '@magic/shared/graph';
import { Lens } from '@magic/shared/lens';
import { SimulationGuardBuilder } from '@magic/shared/simulation';
import type {
  SetupContext,
  SimulationDefinition,
  SimulationEffects,
} from '@magic/shared/simulation/types';
import {
  EdgeRole,
  NodeRole,
  type Themer,
  createEdgeIdThemer,
  createEdgeThemer,
  createNodeIdThemer,
  createNodeThemer,
} from '@magic/shared/theme';
import tinycolor from 'tinycolor2';

import { Ref } from 'vue';

import Considering from './components/Considering.vue';
import Excluded from './components/Excluded.vue';
import {
  kruskalsExplainer,
  kruskalsSlotIds,
  primsExplainer,
  primsSlotIds,
} from './explainer.ts';
import {
  KruskalsFrame,
  KruskalsFunction,
  PrimsFrame,
  PrimsFunction,
} from './frame.ts';

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

export type StartNodeId = Ref<GNode['id'] | undefined>;

export type PrimsSimulationOptions = {
  graph: Graph;
  startNodeId: StartNodeId;
};

// shared by both algorithms: an edge the algorithm is not acting on fades
// instead of disappearing, so it stays legible without competing for attention
const createFadedEdgeThemer = (graph: Graph) => {
  const fadedIds = new Set<string>();
  const fade = (edge: CoreEdge, resolveUnderneath: () => Color) => {
    if (!fadedIds.has(edge.id)) return;
    return tinycolor(resolveUnderneath()).setAlpha(0.35).toHex8String();
  };
  const themer = graph.theme.createThemer({
    surface: {
      'edge.default.color': fade,
      'edge.default.text.color': fade,
      'edge.hover.color': fade,
      'edge.hover.text.color': fade,
    },
  });

  return {
    themer,
    setIds: (ids: readonly string[]) => {
      fadedIds.clear();
      for (const id of ids) fadedIds.add(id);
    },
  };
};

const primsEffects = (
  graph: Graph,
  context: SetupContext<PrimsFrame>,
): SimulationEffects<PrimsFrame> => {
  const frontier = createNodeIdThemer(graph, nodeRoles.frontier);
  const settled = createNodeIdThemer(graph, nodeRoles.settled);
  const anchor = createNodeIdThemer(graph, nodeRoles.anchor);
  const exploring = createNodeIdThemer(graph, nodeRoles.exploring);

  const tree = createEdgeIdThemer(graph, edgeRoles.tree);
  const candidateEdge = createEdgeIdThemer(graph, edgeRoles.candidate);
  const crossingEdge = createEdgeIdThemer(graph, edgeRoles.crossing);
  // colored solid before excludedEdgeIds picks them up and fades them
  const excludingEdge = createEdgeIdThemer(graph, 'rejected');
  const excludedEdge = createFadedEdgeThemer(graph);

  const themers = [
    frontier,
    settled,
    anchor,
    exploring,
    tree,
    candidateEdge,
    crossingEdge,
    excludingEdge,
    excludedEdge,
  ];

  const syncToFrame = (frame: PrimsFrame) => {
    const selectedEdgeEndpoints = frame.selectedEdge
      ? [
          graph.getEdge(frame.selectedEdge).source,
          graph.getEdge(frame.selectedEdge).target,
        ]
      : [];

    exploring.setIds(
      frame.activeNodeId
        ? [frame.activeNodeId, ...selectedEdgeEndpoints]
        : selectedEdgeEndpoints,
    );
    settled.setIds(frame.treeNodeIds);
    frontier.setIds(frame.pendingNodeIds ?? []);
    anchor.setId(frame.anchorNodeId);
    tree.setIds(frame.treeEdgeIds);
    candidateEdge.setIds(frame.candidateEdges ?? []);
    crossingEdge.setIds(frame.selectedEdge ? [frame.selectedEdge] : []);
    excludingEdge.setIds(frame.excludingEdges ?? []);
    excludedEdge.setIds(frame.excludedEdgeIds);
  };

  const lens: Lens = {
    id: 'min-spanning-trees/prims',
    components: [
      {
        component: Excluded,
        position: 'center-left',
        id: primsSlotIds.excluded,
      },
      {
        component: Considering,
        position: 'center-right',
        id: primsSlotIds.considering,
      },
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
    onViolation: context.stopSimulation,
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
    .minNodes(2)
    .build(),
  collectFrames: (collector) => {
    prims(
      options.graph,
      nullThrows(options.startNodeId.value, 'start node id not defined'),
    )(collector);
  },
  setup: (context) => primsEffects(options.graph, context),
});

// active = the endpoints of the edge being added to the tree right now. a node
// the tree already reached goes back to reading as a plain node
type KruskalsNodeConcept = 'active';

const kruskalsNodeRoles = {
  active: 'active',
} as const satisfies Record<KruskalsNodeConcept, NodeRole>;

// crossing = the edge the algorithm is looking at right now
type KruskalsEdgeConcept = 'crossing';

const kruskalsEdgeRoles = {
  crossing: 'crossing',
} as const satisfies Record<KruskalsEdgeConcept, EdgeRole>;

// a decision paints an edge and both of its endpoints one color, which no
// single role covers, and neither vocabulary has a green or a red to give, so
// kruskals names its two decision colors itself
const createDecisionThemer = (graph: Graph, color: Color) => {
  let edgeId: GEdge['id'] | undefined;
  let nodeIds: readonly GNode['id'][] = [];

  return {
    themers: [
      createEdgeThemer(graph, (edge) =>
        edge.id === edgeId ? color : undefined,
      ),
      createNodeThemer(graph, (node) =>
        nodeIds.includes(node.id) ? color : undefined,
      ),
    ],
    set: (edge: GEdge['id'] | undefined, nodes: readonly GNode['id'][]) => {
      edgeId = edge;
      nodeIds = nodes;
    },
  };
};

export type KruskalsSimulationOptions = {
  graph: Graph;
};

const kruskalsEffects = (
  graph: Graph,
  context: SetupContext<KruskalsFrame>,
): SimulationEffects<KruskalsFrame> => {
  const active = createNodeIdThemer(graph, kruskalsNodeRoles.active);

  const consideringEdge = createEdgeIdThemer(graph, kruskalsEdgeRoles.crossing);
  const accepted = createDecisionThemer(graph, colors.GREEN_600);
  const excluded = createDecisionThemer(graph, colors.RED_600);
  // an edge the tree has not taken stays faded, so the tree reads as the edges
  // left at full strength rather than as a color of its own
  const untakenEdge = createFadedEdgeThemer(graph);

  // activation order is paint order (later wins on overlapping ids), so the
  // decision themers must activate after untaken to stay solid on the frame
  // that decides their edge
  const themers: Themer[] = [
    active.themer,
    untakenEdge.themer,
    consideringEdge.themer,
    ...accepted.themers,
    ...excluded.themers,
  ];

  const syncToFrame = (frame: KruskalsFrame) => {
    const treeEdgeIds = new Set(frame.treeEdgeIds);
    const isAccept = frame.type === 'accept-edge';
    const isExclude = frame.type === 'exclude-edge';
    const endpoints = frame.activeNodeIds ?? [];

    // amber marks the edge only while it is still a question, then the decision
    // color takes over both it and the nodes it runs between
    active.setIds(frame.type === 'consider-edge' ? endpoints : []);
    accepted.set(isAccept ? frame.edge : undefined, isAccept ? endpoints : []);
    excluded.set(
      isExclude ? frame.edge : undefined,
      isExclude ? endpoints : [],
    );
    consideringEdge.setId(
      frame.type === 'consider-edge' ? frame.edge : undefined,
    );
    // the edge under decision holds its color for as long as it is the subject,
    // then falls back to the tree/faded split like every other edge
    untakenEdge.setIds(
      graph.edges.value
        .filter(
          (edge) => !treeEdgeIds.has(edge.id) && edge.id !== frame.selectedEdge,
        )
        .map((edge) => edge.id),
    );
  };

  const lens: Lens = {
    id: 'min-spanning-trees/kruskals',
    components: [
      {
        component: Excluded,
        position: 'center-left',
        id: kruskalsSlotIds.excluded,
      },
      {
        component: Considering,
        position: 'center-right',
        id: kruskalsSlotIds.considering,
      },
    ],
    activate: () => {
      for (const themer of themers) themer.activate();
    },
    deactivate: () => {
      for (const themer of themers) themer.deactivate();
    },
  };

  return {
    lens,
    explainer: kruskalsExplainer(graph),
    onSetupCompleted: syncToFrame,
    onFrameTransition: syncToFrame,
    onViolation: context.stopSimulation,
  };
};

export const kruskalsSimulationDefinition = (
  kruskals: KruskalsFunction,
  options: KruskalsSimulationOptions,
): SimulationDefinition<KruskalsFrame> => ({
  guard: new SimulationGuardBuilder(options.graph)
    .minNodes(2)
    .custom(() => {
      if (options.graph.edges.value.length < 1) {
        return { id: 'no-edges' };
      }
    })
    .build(),
  collectFrames: (collector) => {
    kruskals(options.graph)(collector);
  },
  setup: (context) => kruskalsEffects(options.graph, context),
});
