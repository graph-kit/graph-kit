import { MaybeGetter } from '@core/utils/maybeGetter/index';

import { StyleValue } from 'vue';

import { Graph } from '../graph/types.ts';
import { Shell } from '../product/types.ts';

/** both halves an explainer can reach: the graph it describes and the shell around it */
export type ExplainerContext = {
  graph: Graph;
  shell: Shell;
};

export type Explainer = {
  content: MaybeGetter<string, [ExplainerContext]>;
  highlights?: MaybeGetter<ExplainerHighlight[], [ExplainerContext]>;
};

type GetterWithContext = (context: ExplainerContext) => void;

export type ExplainerHighlight = {
  activate?: GetterWithContext;
  deactivate?: GetterWithContext;
  onMounted?: GetterWithContext;
  onUnmounted?: GetterWithContext;
  tooltipLabel?: MaybeGetter<string | undefined, [ExplainerContext]>;
  // TODO nest classes and styles under attrs field, and have attrs field spread onto button
  classes?: MaybeGetter<string, [ExplainerContext]>;
  styles?: MaybeGetter<StyleValue, [ExplainerContext]>;
};
