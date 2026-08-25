import { getCtx } from '@core/utils/canvas/index';

import { AnimationPlugin } from './types.ts';

export const animation: AnimationPlugin = ({ controls }) => {
  const autoAnimate = () =>
    controls.surface.renderer.autoAnimate.captureFrame(() =>
      controls.surface.aggregator.draw(getCtx(controls.surface.canvas)),
    );

  // a capture window left open freezes every shape it snapshotted on its pre-mutation
  // schema, so finalize has to run even when the mutation throws
  const capture = <MutationResult>(mutate: () => MutationResult) => {
    const finalize = autoAnimate();
    try {
      return mutate();
    } finally {
      finalize();
    }
  };

  return {
    name: 'animation',
    controls: {
      auto: autoAnimate,
      capture,
    },
  };
};
