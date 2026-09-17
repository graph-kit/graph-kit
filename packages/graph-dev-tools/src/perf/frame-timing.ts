/**
 * Frame timing for the canvas render loop:
 *
 * - interval: the gap between consecutive repaints. answers "are we hitting 60"
 * - draw: how long the repaint itself takes. answers "why not"
 *
 * A run can miss its target with a fast draw (something else is hogging the main
 * thread) or hit its target with a slow one (nothing else is competing yet), and
 * a single averaged "fps" hides both cases.
 */
import { percentile } from './percentile.ts';

export type RepaintEvents = {
  subscribe: (event: RepaintEvent, callback: () => void) => void;
  unsubscribe: (event: RepaintEvent, callback: () => void) => void;
};

type RepaintEvent = 'onBeforeRepaint' | 'onAfterRepaint';

export type TimingSummary = {
  p50: number;
  p95: number;
  max: number;
};

export type FrameTimingStats = {
  /** repaints recorded since the last reset */
  frameCount: number;
  /** ms between the start of consecutive repaints */
  frameIntervalMs: TimingSummary;
  /** ms spent inside the repaint */
  drawDurationMs: TimingSummary;
  /**
   * repaints whose interval ran past 1.5x the target. a handful during startup
   * is normal, a steady stream is the symptom being chased
   */
  droppedFrameCount: number;
  /** frames per second implied by the median interval */
  medianFps: number;
};

const SAMPLE_CAPACITY = 300;
const DROPPED_FRAME_THRESHOLD = 1.5;

const summarize = (samples: number[]): TimingSummary => ({
  p50: percentile(samples, 0.5),
  p95: percentile(samples, 0.95),
  max: samples.length === 0 ? 0 : Math.max(...samples),
});

export type FrameTimingRecorder = {
  stats: () => FrameTimingStats;
  reset: () => void;
  stop: () => void;
};

export const startFrameTimingRecorder = (
  events: RepaintEvents,
  { targetFps = 60 }: { targetFps?: number } = {},
): FrameTimingRecorder => {
  const intervals: number[] = [];
  const draws: number[] = [];

  let frames = 0;
  let dropped = 0;
  let repaintStartedAt = 0;
  let previousRepaintStartedAt: number | undefined;

  const targetInterval = 1000 / targetFps;

  /*
    the ring is a plain array with a shift at capacity rather than a real ring
    buffer. a few hundred entries at 60hz is nothing, and keeping the array in
    chronological order means the percentile helper can just sort a copy
  */
  const record = (samples: number[], value: number) => {
    samples.push(value);
    if (samples.length > SAMPLE_CAPACITY) samples.shift();
  };

  const onBeforeRepaint = () => {
    repaintStartedAt = performance.now();

    if (previousRepaintStartedAt !== undefined) {
      const interval = repaintStartedAt - previousRepaintStartedAt;
      record(intervals, interval);
      if (interval > targetInterval * DROPPED_FRAME_THRESHOLD) dropped++;
    }

    previousRepaintStartedAt = repaintStartedAt;
  };

  const onAfterRepaint = () => {
    record(draws, performance.now() - repaintStartedAt);
    frames++;
  };

  events.subscribe('onBeforeRepaint', onBeforeRepaint);
  events.subscribe('onAfterRepaint', onAfterRepaint);

  const stats = (): FrameTimingStats => {
    const frameIntervalMs = summarize(intervals);
    return {
      frameCount: frames,
      frameIntervalMs,
      drawDurationMs: summarize(draws),
      droppedFrameCount: dropped,
      medianFps: frameIntervalMs.p50 === 0 ? 0 : 1000 / frameIntervalMs.p50,
    };
  };

  return {
    stats,
    reset: () => {
      intervals.length = 0;
      draws.length = 0;
      frames = 0;
      dropped = 0;
      previousRepaintStartedAt = undefined;
    },
    stop: () => {
      events.unsubscribe('onBeforeRepaint', onBeforeRepaint);
      events.unsubscribe('onAfterRepaint', onAfterRepaint);
    },
  };
};
