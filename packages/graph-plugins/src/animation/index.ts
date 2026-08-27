import { FinalizeCaptureOptions } from '@canvas/primitives/animation/auto-animate/createAutoAnimate';
import { createEventHub } from '@core/events/createEventHub';
import { getCtx } from '@core/utils/canvas/index';
import { signal } from '@reactive/primitives/index';

import { createNodeMotion } from './createNodeMotion.ts';
import { createAnimationEventRegistry } from './events.ts';
import { AnimationPlugin, CaptureOptions } from './types.ts';

type FinalizeCapture = (options?: FinalizeCaptureOptions) => void;

export const animation: AnimationPlugin = ({ controls }) => {
  const events = createEventHub(createAnimationEventRegistry());
  const { autoAnimate } = controls.surface.renderer;

  const motion = createNodeMotion({
    positions: controls.positions,
    nodeIds: () => controls.nodes().map((node) => node.id),
    hasNode: (nodeId) => controls.isNode(nodeId),
  });

  const drawnIds = () =>
    new Set([
      ...controls.nodes().map((node) => node.id),
      ...controls.edges().map((edge) => edge.id),
    ]);

  const autoAnimateCapture = () =>
    autoAnimate.captureFrame(() =>
      controls.surface.aggregator.draw(getCtx(controls.surface.canvas)),
    );

  /** whether the duration currently set is a one-off override rather than the consumers */
  let overriding = false;

  // the renderer reads its duration when the capture window closes, so an
  // override is a swap held across finalize rather than an argument to it
  const finalizeWith = (
    finalize: FinalizeCapture,
    durationMs: number,
    options: FinalizeCaptureOptions,
  ) => {
    const consumerDurationMs = autoAnimate.animationDuration;
    overriding = true;
    autoAnimate.setAnimationDuration(durationMs);
    try {
      finalize(options);
    } finally {
      autoAnimate.setAnimationDuration(consumerDurationMs);
      overriding = false;
    }
  };

  const openCapture = () => ({
    before: motion.snapshot(),
    idsBefore: drawnIds(),
    finalize: autoAnimateCapture(),
  });

  type OpenCapture = ReturnType<typeof openCapture>;

  const closeCapture = (
    { before, idsBefore, finalize }: OpenCapture,
    { durationMs, ignore }: CaptureOptions,
  ) => {
    const moves = motion.collect(before);
    const persisted = new Set(
      [...drawnIds()].filter((id) => idsBefore.has(id)),
    );

    const options: FinalizeCaptureOptions = {
      ignore: ignore === undefined ? undefined : new Set(ignore),
      ignoreGeometry: persisted,
    };

    if (durationMs === undefined) finalize(options);
    else finalizeWith(finalize, durationMs, options);

    motion.start(moves, durationMs ?? autoAnimate.animationDuration);
  };

  // a capture window left open freezes every shape it snapshotted on its pre-mutation
  // schema, so finalize has to run even when the mutation throws
  const capture = <MutationResult>(
    mutate: () => MutationResult,
    options: CaptureOptions = {},
  ) => {
    const open = openCapture();
    try {
      return mutate();
    } finally {
      closeCapture(open, options);
    }
  };

  const auto = (options: CaptureOptions = {}) => {
    const open = openCapture();
    return () => closeCapture(open, options);
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
