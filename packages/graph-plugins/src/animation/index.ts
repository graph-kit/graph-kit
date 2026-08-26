import { createEventHub } from '@core/events/createEventHub';
import { getCtx } from '@core/utils/canvas/index';
import { signal } from '@reactive/primitives/index';

import { createAnimationEventRegistry } from './events.ts';
import { AnimationPlugin, CaptureOptions } from './types.ts';

export const animation: AnimationPlugin = ({ controls }) => {
  const events = createEventHub(createAnimationEventRegistry());
  const { autoAnimate } = controls.surface.renderer;

  const autoAnimateCapture = () =>
    autoAnimate.captureFrame(() =>
      controls.surface.aggregator.draw(getCtx(controls.surface.canvas)),
    );

  /** whether the duration currently set is a one-off override rather than the consumers */
  let overriding = false;

  // the renderer reads its duration when the capture window closes, so an
  // override is a swap held across finalize rather than an argument to it
  const finalizeWith = (finalize: () => void, durationMs: number) => {
    const consumerDurationMs = autoAnimate.animationDuration;
    overriding = true;
    autoAnimate.setAnimationDuration(durationMs);
    try {
      finalize();
    } finally {
      autoAnimate.setAnimationDuration(consumerDurationMs);
      overriding = false;
    }
  };

  // a capture window left open freezes every shape it snapshotted on its pre-mutation
  // schema, so finalize has to run even when the mutation throws
  const capture = <MutationResult>(
    mutate: () => MutationResult,
    { durationMs }: CaptureOptions = {},
  ) => {
    const finalize = autoAnimateCapture();
    try {
      return mutate();
    } finally {
      if (durationMs === undefined) finalize();
      else finalizeWith(finalize, durationMs);
    }
  };

  const auto = ({ durationMs }: CaptureOptions = {}) => {
    const finalize = autoAnimateCapture();
    if (durationMs === undefined) return finalize;
    return () => finalizeWith(finalize, durationMs);
  };

  // the renderer owns the duration, so the signal follows it rather than being
  // written alongside it. anything setting it through the surface lands here too
  const duration = signal(autoAnimate.animationDuration);
  autoAnimate.events.subscribe(
    'onAnimationDurationChanged',
    (newDurationMs, oldDurationMs) => {
      if (overriding) return;
      duration(newDurationMs);
      events.emit('onAnimationDurationChanged', newDurationMs, oldDurationMs);
    },
  );

  return {
    name: 'animation',
    controls: {
      auto,
      capture,
      duration,
      setDuration: autoAnimate.setAnimationDuration,
      events,
    },
  };
};
