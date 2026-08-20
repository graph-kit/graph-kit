import { Ref, ref } from 'vue';

import { Graph } from '../../graph/types.ts';

/**
 * keeps the result of a token resolution in sync with the canvas, since a
 * themer activating or a preset changing only shows up on the next draw
 */
export const useResolvedStyles = <T>(graph: Graph, resolve: () => T) => {
  const styles = ref(resolve()) as Ref<T>;

  const syncToRef = () => {
    styles.value = resolve();
  };
  graph.surface.aggregator.events.subscribe('onDraw', syncToRef);

  const dispose = () =>
    graph.surface.aggregator.events.unsubscribe('onDraw', syncToRef);

  return {
    styles,
    dispose,
  };
};
