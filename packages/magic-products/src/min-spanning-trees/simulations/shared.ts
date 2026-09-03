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

export type StartNodeId = Ref<GNode['id'] | undefined>;

export type PrimsSimulationOptions = {
  graph: Graph;
  startNodeId: StartNodeId;
};

const createDecisionThemer = (graph: Graph, color: Color) => {
  let edgeIds: readonly GEdge['id'][] = [];
  let nodeIds: readonly GNode['id'][] = [];

  return {
    themers: [
      createEdgeThemer(graph, (edge) =>
        edgeIds.includes(edge.id) ? color : undefined,
      ),
      createNodeThemer(graph, (node) =>
        nodeIds.includes(node.id) ? color : undefined,
      ),
    ],
    set: (edges: readonly GEdge['id'][], nodes: readonly GNode['id'][]) => {
      edgeIds = edges;
      nodeIds = nodes;
    },
  };
};

const defaultFadedOpacity = 0.35;

const createFadedEdgeThemer = (graph: Graph) => {
  const fadedIds = new Set<string>();
  let opacity = defaultFadedOpacity;
  const fade = (edge: CoreEdge, resolveUnderneath: () => Color) => {
    if (!fadedIds.has(edge.id)) return;
    return tinycolor(resolveUnderneath()).setAlpha(opacity).toHex8String();
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
    setOpacity: (next: number) => {
      opacity = next;
    },
  };
};

const primsEffects = (
  graph: Graph,
  context: SetupContext<PrimsFrame>,
): SimulationEffects<PrimsFrame> => {
  // registered first so a decision this frame paints over it
  const visited = createDecisionThemer(graph, colors.AMBER_500);
  const considering = createDecisionThemer(graph, colors.PURPLE_600);
  const added = createDecisionThemer(graph, colors.GREEN_600);
  const excluded = createDecisionThemer(graph, colors.RED_600);
  const dimmedEdge = createFadedEdgeThemer(graph);

  const themers: Themer[] = [
    ...visited.themers,
    ...considering.themers,
    ...added.themers,
    ...excluded.themers,
    dimmedEdge.themer,
  ];

  const syncToFrame = (frame: PrimsFrame) => {
    const isSelect = frame.type === 'select-edge';
    const isExclude = frame.type === 'exclude-edges';
    const endpoints = frame.activeNodeIds ?? [];
    const candidates =
      frame.type === 'consider-edges' ? frame.candidateEdges : [];
    // solid red on the frame that rules them out, faded red from then on
    const justExcluded = isExclude ? frame.edges : [];

    // once the tree is final nothing else matters, so the rest all but vanishes
    dimmedEdge.setOpacity(frame.type === 'end' ? 0.05 : defaultFadedOpacity);

    visited.set([], frame.treeNodeIds);
    considering.set(candidates, []);
    added.set(isSelect ? [frame.edge] : [], isSelect ? endpoints : []);
    excluded.set(frame.excludedEdgeIds, isExclude ? endpoints : []);

    const lit = new Set([
      ...frame.treeEdgeIds,
      ...candidates,
      ...justExcluded,
      frame.selectedEdge,
    ]);
    dimmedEdge.setIds(
      graph.edges.value
        .filter((edge) => !lit.has(edge.id))
        .map((edge) => edge.id),
    );
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
      for (const themer of themers) themer.activate();
    },
    deactivate: () => {
      for (const themer of themers) themer.deactivate();
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
  id: string,
  prims: PrimsFunction,
  options: PrimsSimulationOptions,
): SimulationDefinition<PrimsFrame> => ({
  id,
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
  const dimmedEdge = createFadedEdgeThemer(graph);

  const themers: Themer[] = [
    active.themer,
    consideringEdge.themer,
    ...accepted.themers,
    ...excluded.themers,
    dimmedEdge.themer,
  ];

  const syncToFrame = (frame: KruskalsFrame) => {
    const treeEdgeIds = new Set(frame.treeEdgeIds);
    const isAccept = frame.type === 'accept-edge';
    const isExclude = frame.type === 'exclude-edge';
    const endpoints = frame.activeNodeIds ?? [];

    active.setIds(frame.type === 'consider-edge' ? endpoints : []);
    accepted.set(isAccept ? [frame.edge] : [], isAccept ? endpoints : []);
    excluded.set(frame.excludedEdgeIds, isExclude ? endpoints : []);

    consideringEdge.setId(
      frame.type === 'consider-edge' ? frame.edge : undefined,
    );

    dimmedEdge.setIds(
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
  id: string,
  kruskals: KruskalsFunction,
  options: KruskalsSimulationOptions,
): SimulationDefinition<KruskalsFrame> => ({
  id,
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
