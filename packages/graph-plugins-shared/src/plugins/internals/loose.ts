import { GenericEventMap } from '@core/events/types';
import { ComputedTokenResolver } from '@graph/computed-tokens/index';
import { CoreActions } from '@graph/core/actions/types';
import { ConsumerEventsHub } from '@graph/core/consumer-events';
import { CoreGetters } from '@graph/core/getters';
import {
  GraphActions,
  PartialBaseActions,
} from '@graph/primitives/actions/types';
import { BaseGetters, GraphGetters } from '@graph/primitives/getters/types';
import { LooseGraphTransit } from '@graph/primitives/transit/types';

import { GetterRenderFunctions } from './plugin.ts';

export type LoosePluginSchema = {
  name: string;
  controls: object;
  events: GenericEventMap;
  getters: Partial<BaseGetters>;
  actions: PartialBaseActions;
  transit: any;
  dependsOn: LooseGraphPlugin[];
  optionalDependsOn: LooseGraphPlugin[];
};

type LoosePluginInput = {
  controls: any;
  events: ConsumerEventsHub;
  actions: GraphActions<CoreActions>;
  // see [1] in ./plugin.ts — a stable accessor for the fully-composed graph
  // actions, safe to capture in a closure and invoke after folding completes
  finalActions: GraphActions<CoreActions>;
  // see [3] in ./plugin.ts — getters reading plugin owned state require that state
  // to live in a @reactive/primitives container
  getters: GraphGetters<CoreGetters>;
  // see [2] in ./plugin.ts — a stable accessor for the graph wide encode/decode
  // surface, assembled from every plugin's transit controls once folding completes
  finalTransit: LooseGraphTransit;
  // see [4] in ./plugin.ts for the stable accessor to the computed token resolver,
  // built from every plugin's detectors once folding completes
  finalTokenResolver: ComputedTokenResolver;
  // see [5] in ./plugin.ts — the node and edge render functions the graph itself draws
  // with, built once folding has produced every plugin's theme detectors
  finalRenderFunctions: GetterRenderFunctions;
};

type LoosePluginOutput = {
  name: LooseGraphPlugin['name'];
  // absent unless the plugin declares them in its schema (see ./output-fields.ts)
  controls?: LoosePluginSchema['controls'];
  actions?: GraphActions<any>;
  getters?: GraphGetters<any>;
  onAfterInit?: () => void;
  transit?: {
    encode: () => any;
    decode: (data: any) => void;
    validate: (data: any) => boolean;
  };
};

export type LooseGraphPlugin = (options: LoosePluginInput) => LoosePluginOutput;
