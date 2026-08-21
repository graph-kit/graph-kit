import { AggregatorTransformer } from '@canvas/primitives/aggregator/types';
import { nullThrows } from '@core/utils/assert';
import { createComputedTokenResolver } from '@graph/computed-tokens/index';
import { core } from '@graph/core/index';
import { CoreOptions } from '@graph/core/options';
import { CoreControls } from '@graph/core/types';
import {
  ExtractActions,
  ExtractControls,
  ExtractGetters,
  ExtractTransitPayload,
  LooseGraphPlugin,
  PluginThemes,
} from '@graph/plugins-shared/plugins';
import { SurfaceControls } from '@graph/plugins/surface/types';
import { GraphActions } from '@graph/primitives/actions/types';
import { GraphGetters } from '@graph/primitives/getters/types';
import { LooseGraphTransit } from '@graph/primitives/transit/types';
import type { Prettify } from 'ts-essentials';

import { createCanvasElementFactories } from './canvas-elements.ts';
import { createThemer } from './createThemer.ts';
import { foldPlugins } from './fold-plugins.ts';
import { createGraphTransit } from './graph-transit.ts';
import { GraphTransit } from './types.ts';

type CreateGraphOptions<
  TPlugins extends LooseGraphPlugin[],
  PresetName extends string,
> = {
  plugins: TPlugins;
  themePresets: Record<PresetName, PluginThemes<NoInfer<TPlugins>>>;
  coreOptions?: Partial<CoreOptions>;
};

export const createGraph = <
  const TPlugins extends LooseGraphPlugin[],
  PresetName extends string,
>({
  plugins,
  themePresets,
  coreOptions,
}: CreateGraphOptions<TPlugins, PresetName>) => {
  const coreGraph = core(coreOptions ?? {});

  const presetNames = Object.keys(themePresets) as PresetName[];

  let activePresetName = nullThrows(
    presetNames.at(0),
    'createGraph requires at least 1 theme preset!',
  );

  const folded = foldPlugins(
    coreGraph,
    plugins,
    themePresets,
    () => activePresetName,
  );

  const events = folded.events;

  const controls = folded.controls as Prettify<
    ExtractControls<NoInfer<TPlugins>>
  >;

  const actions = folded.actions as GraphActions<
    ExtractActions<NoInfer<TPlugins>>
  >;

  const getters = folded.getters as GraphGetters<
    ExtractGetters<NoInfer<TPlugins>>
  >;

  const {
    pluginTransitControls,
    resolveFinalTransit,
    consumerEvents,
    transitEvents,
    getNodes,
    getEdges,
  } = folded;

  const tokenResolver = createComputedTokenResolver(folded.themeDetectors);

  // plugins captured `finalTokenResolver` during fold, before the detector map was
  // complete. point it at the real resolver now (see [4] in plugins/internals/plugin.ts)
  folded.resolveFinalTokenResolver(tokenResolver);

  // assume we have canvas in controls since this is a theme aware orchestrator!
  const castControls = controls as unknown as CoreControls & {
    surface: SurfaceControls;
  };

  const {
    nodeToCanvasElement: nodeCanvasElement,
    edgeToCanvasElement: edgeCanvasElement,
    renderFunctions,
    setRenderFunction,
  } = createCanvasElementFactories(castControls, tokenResolver);

  // plugins captured `finalRenderFunctions` during fold, before the render functions
  // could be built (see [5] in plugins/internals/plugin.ts)
  folded.resolveFinalRenderFunctions(renderFunctions);

  const transformer: AggregatorTransformer = (agg) => {
    agg.push(...controls.nodes().map(nodeCanvasElement));
    agg.push(...controls.edges().map(edgeCanvasElement));
    return agg;
  };

  castControls.surface.aggregator.addTransformer(transformer);

  type GraphTransitControls = GraphTransit<
    Prettify<ExtractTransitPayload<NoInfer<TPlugins>>>
  >;

  const transit = createGraphTransit<
    ReturnType<GraphTransitControls['encode']>
  >({
    pluginTransitControls,
    coreGraph,
    consumerEvents,
    transitEvents,
  });

  // plugins captured `finalTransit` during fold — point it at the real thing now that
  // it exists. the cast drops the precise per-plugin payload shape, which plugins
  // can't know at author time anyway (see LooseGraphTransit).
  resolveFinalTransit(transit as unknown as LooseGraphTransit);

  // the public surface is the decorated getNodes()/getEdges(), not core's raw pair
  const { nodes: _coreNodes, edges: _coreEdges, ...restControls } = controls;

  return {
    ...restControls,
    ...getters,
    actions,
    events,
    transit,
    getNodes: getNodes as () => ReturnType<typeof getters.getNode>[],
    getEdges: getEdges as () => ReturnType<typeof getters.getEdge>[],
    theme: {
      createThemer: createThemer<TPlugins>(controls),
      tokenResolver,
      activePresetName: () => activePresetName,
      activePreset: () => themePresets[activePresetName],
      setActivePreset: (newPresetName: PresetName) => {
        return (activePresetName = newPresetName);
      },
    },
    setRenderFunction,
  };
};

type GraphOptions = {
  plugins: LooseGraphPlugin[];
  presetName: string;
};

export type Graph<Options extends GraphOptions> = ReturnType<
  typeof createGraph<Options['plugins'], Options['presetName']>
>;
