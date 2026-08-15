import { getValue } from '@core/utils/maybeGetter/index';
import { ConsumerEventsHub } from '@graph/core/consumer-events';
import { core } from '@graph/core/index';
import {
  LooseGraphPlugin,
  PluginThemeField,
} from '@graph/plugins-shared/plugins';
import { TransitControls } from '@graph/primitives/transit/types';
import { computed } from '@reactive/primitives/index';

import {
  ConsumerEventHub,
  TransitEventHub,
  createConsumerEventHub,
  createFinalActionsProxy,
  createTransitEventHub,
  wrapActionsWithConsumerEvents,
  wrapPositionsControlsWithConsumerEvents,
  wrapWeightsControlsWithConsumerEvents,
} from './consumer-events.ts';
import { createFinalRenderFunctionsProxy } from './final-render-functions.ts';
import { createFinalTokenResolverProxy } from './final-token-resolver.ts';
import { createFinalTransitProxy } from './final-transit.ts';

type PluginTransitControl = {
  pluginName: string;
  transit: TransitControls<any>;
};

type FoldedPlugins = {
  controls: any;
  events: ConsumerEventsHub;
  consumerEvents: ConsumerEventHub;
  transitEvents: TransitEventHub;
  actions: any;
  getters: any;
  themeDetectors: NonNullable<PluginThemeField<any>['theme']['detectors']>;
  pluginTransitControls: PluginTransitControl[];
  resolveFinalTransit: ReturnType<
    typeof createFinalTransitProxy
  >['resolveFinalTransit'];
  resolveFinalTokenResolver: ReturnType<
    typeof createFinalTokenResolverProxy
  >['resolveFinalTokenResolver'];
  resolveFinalRenderFunctions: ReturnType<
    typeof createFinalRenderFunctionsProxy
  >['resolveFinalRenderFunctions'];
  getNodes: () => any[];
  getEdges: () => any[];
};

// TODO add topo sort and explicit error handling for missing plugin dependencies
export const foldPlugins = (
  coreGraph: ReturnType<typeof core>,
  plugins: LooseGraphPlugin[],
  themePresets: Record<string, any>,
  getActivePresetName: () => string,
): FoldedPlugins => {
  // create-graph owns the consumer event vocabulary (onNodesAdded, onStructureChange,
  // onEdgeWeightsChanged, etc.) since only it knows when a fully-composed plugin action
  // has finished, not just the underlying core transaction. it derives these by wrapping
  // the calls it has authority over (actions below, weight controls here) — never by
  // subscribing to core's own event hub. merged in up front so plugins can subscribe
  // during setup.
  const consumerEvents = createConsumerEventHub();

  // separate from consumerEvents — encode/decode report on the graph as a
  // serialized whole rather than on a change to its structure. created here so plugins
  // can subscribe during setup, even though only createGraphTransit ever emits on it.
  const transitEvents = createTransitEventHub();

  let controls = {
    ...coreGraph.controls,
    weights: wrapWeightsControlsWithConsumerEvents(
      coreGraph.controls.weights,
      consumerEvents,
    ),
    positions: wrapPositionsControlsWithConsumerEvents(
      coreGraph.controls.positions,
      consumerEvents,
    ),
  };

  // consumer events are the primary surface — spread directly onto the top-level
  // `events` field. raw core events are still reachable, but namespaced under
  // `_internal` so they don't crowd the default autocomplete (see ConsumerEventsHub).
  const events: ConsumerEventsHub = {
    ...consumerEvents,
    transit: transitEvents,
    _internal: {
      core: coreGraph.events,
    },
  };
  let actions = coreGraph.actions;
  let getters = coreGraph.getters;
  const { finalActions, resolveFinalActions } = createFinalActionsProxy();
  const { finalTransit, resolveFinalTransit } = createFinalTransitProxy();
  const { finalTokenResolver, resolveFinalTokenResolver } =
    createFinalTokenResolverProxy();
  const { finalRenderFunctions, resolveFinalRenderFunctions } =
    createFinalRenderFunctionsProxy();
  let themeDetectors: NonNullable<PluginThemeField<any>['theme']['detectors']> =
    {};

  const pluginTransitControls: PluginTransitControl[] = [
    { pluginName: 'core', transit: coreGraph.transit },
  ];

  for (const plugin of plugins) {
    const pluginResult = plugin({
      controls,
      events,
      actions,
      finalActions,
      getters,
      finalTransit,
      finalTokenResolver,
      finalRenderFunctions,
    });

    // a plugin only appears under its own namespace if it declared controls, otherwise
    // the key would sit there holding undefined and read as a plugin that shipped nothing
    if (pluginResult.controls) {
      controls = { ...controls, [pluginResult.name]: pluginResult.controls };
    }
    actions = { ...actions, ...pluginResult.actions };
    getters = { ...getters, ...pluginResult.getters };

    const transit = pluginResult.transit;
    if (transit) {
      pluginTransitControls.push({ pluginName: pluginResult.name, transit });
    }

    const pluginThemeField: PluginThemeField<any>['theme'] | undefined = (
      pluginResult.controls as any
    )?.theme;

    if (pluginThemeField) {
      const { set } = pluginThemeField.createLayer(
        'create-graph/theme-presets',
      );
      const tokens = Object.keys(
        themePresets[getActivePresetName()][pluginResult.name],
      );
      for (const token of tokens) {
        set(token, (...args: any[]) =>
          getValue(
            themePresets[getActivePresetName()][pluginResult.name][token],
            ...args,
          ),
        );
      }
      themeDetectors = { ...themeDetectors, ...pluginThemeField.detectors };
    }

    pluginResult.onAfterInit?.();
  }

  const wrappedActions = wrapActionsWithConsumerEvents(actions, consumerEvents);
  resolveFinalActions(wrappedActions);

  const nodes = computed(() =>
    coreGraph.controls.nodes().map((n) => getters.getNode(n.id)),
  );
  const edges = computed(() =>
    coreGraph.controls.edges().map((e) => getters.getEdge(e.id)),
  );

  return {
    controls,
    events,
    consumerEvents,
    transitEvents,
    actions: wrappedActions,
    getters,
    themeDetectors,
    pluginTransitControls,
    resolveFinalTransit,
    resolveFinalTokenResolver,
    resolveFinalRenderFunctions,
    getNodes: nodes,
    getEdges: edges,
  };
};
