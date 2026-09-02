import type { CanvasSurface } from '@canvas/surface/types';

import { type Ref, onBeforeUnmount, ref } from 'vue';

/** how often the counters publish, slow enough for the numbers to be readable */
const SAMPLE_MS = 250;

export type RepaintSample = {
  fps: Ref<number>;
  /** how long the surface spent drawing the average frame of the last sample */
  frameMs: Ref<number>;
};

/**
 * frame timing taken off the surface's own repaint bracket, which is the whole of a
 * frame: the clear, the background pattern and the content draw.
 *
 * published on an interval rather than every frame, so a panel reading it re-renders
 * four times a second instead of sixty and its digits stay still long enough to read
 *
 * @param onSample runs on that same cadence, for anything a panel has to poll rather
 * than subscribe to, like the counts hanging off the aggregator
 */
export const useRepaintSample = (
  surface: CanvasSurface,
  onSample?: () => void,
): RepaintSample => {
  const fps = ref(0);
  const frameMs = ref(0);

  let framesThisSample = 0;
  let drawMsThisSample = 0;
  let frameStartedAt = 0;
  let sampleStartedAt = performance.now();

  const onBeforeRepaint = () => {
    frameStartedAt = performance.now();
  };

  const onAfterRepaint = () => {
    const now = performance.now();
    framesThisSample++;
    drawMsThisSample += now - frameStartedAt;

    const elapsed = now - sampleStartedAt;
    if (elapsed < SAMPLE_MS) return;

    fps.value = Math.round((framesThisSample * 1000) / elapsed);
    frameMs.value = drawMsThisSample / framesThisSample;
    framesThisSample = 0;
    drawMsThisSample = 0;
    sampleStartedAt = now;

    onSample?.();
  };

  surface.events.lifecycle.subscribe('onBeforeRepaint', onBeforeRepaint);
  surface.events.lifecycle.subscribe('onAfterRepaint', onAfterRepaint);

  onBeforeUnmount(() => {
    surface.events.lifecycle.unsubscribe('onBeforeRepaint', onBeforeRepaint);
    surface.events.lifecycle.unsubscribe('onAfterRepaint', onAfterRepaint);
  });

  return { fps, frameMs };
};
