// import { getCtx } from '@core/utils/canvas/index';
import { AnimationPlugin } from './types.ts';

export const animation: AnimationPlugin = ({ controls }) => {
  // TODO re-enable this when auto animation stabilizes
  const autoAnimate = () => () => {};
  // controls.canvas.renderer.autoAnimate.captureFrame(() =>
  //   controls.canvas.aggregator.draw(getCtx(controls.canvas.surface.canvas)),
  // );

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
