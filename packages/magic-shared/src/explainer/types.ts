import { MaybeGetter } from '@core/utils/maybeGetter/index';

import { StyleValue } from 'vue';

import { MagicGraph } from '../graph-product/types.ts';

export type Explainer = {
  content: MaybeGetter<string, [MagicGraph]>;
  highlights?: MaybeGetter<ExplainerHighlight[], [MagicGraph]>;
};

type GetterWithGraph = (graph: MagicGraph) => void;

export type ExplainerHighlight = {
  activate?: GetterWithGraph;
  deactivate?: GetterWithGraph;
  onMounted?: GetterWithGraph;
  onUnmounted?: GetterWithGraph;
  tooltipLabel?: MaybeGetter<string | undefined, [MagicGraph]>;
  // TODO nest classes and styles under attrs field, and have attrs field spread onto button
  classes?: MaybeGetter<string, [MagicGraph]>;
  styles?: MaybeGetter<StyleValue, [MagicGraph]>;
};
