import { Graph } from '../graph/types.ts';

export const disableAnchorsWhileAnnotating = (
  graph: Pick<Graph, 'anchors' | 'annotations'>,
) => {
  let release: (() => void) | undefined;

  graph.annotations.events.subscribe('onActivated', () => {
    release = graph.anchors.lifecycle.suppress('annotations');
  });

  graph.annotations.events.subscribe('onDeactivated', () => {
    release?.();
    release = undefined;
  });
};
