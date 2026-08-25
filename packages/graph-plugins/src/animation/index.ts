import { createEventHub } from '@core/events/createEventHub';
import { getCtx } from '@core/utils/canvas/index';
import { signal } from '@reactive/primitives/index';

import { createAnimationEventRegistry } from './events.ts';
import { AnimationPlugin } from './types.ts';

export const animation: AnimationPlugin = ({ controls }) => {
  const events = createEventHub(createAnimationEventRegistry());
  const { autoAnimate } = controls.surface.renderer;

  const autoAnimateCapture = () =>
    autoAnimate.captureFrame(() =>
      controls.surface.aggregator.draw(getCtx(controls.surface.canvas)),
    );

  // a capture window left open freezes every shape it snapshotted on its pre-mutation
  // schema, so finalize has to run even when the mutation throws
  const capture = <MutationResult>(mutate: () => MutationResult) => {
    const finalize = autoAnimateCapture();
    try {
      return mutate();
    } finally {
      finalize();
    }
  };

  // the renderer owns the duration, so the signal follows it rather than being
  // written alongside it. anything setting it through the surface lands here too
  const duration = signal(autoAnimate.animationDuration);
  autoAnimate.events.subscribe(
    'onAnimationDurationChanged',
    (newDurationMs, oldDurationMs) => {
      duration(newDurationMs);
      events.emit('onAnimationDurationChanged', newDurationMs, oldDurationMs);
    },
  );

  return {
    name: 'animation',
    controls: {
      auto: autoAnimateCapture,
      capture,
      duration,
      setDuration: autoAnimate.setAnimationDuration,
      events,
    },
  };
};
