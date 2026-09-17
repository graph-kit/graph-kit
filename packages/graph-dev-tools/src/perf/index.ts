/**
 * Performance tooling for the canvas render loop, driven by the perf harness.
 *
 * Registers itself on a global so the harness can reach it through
 * `page.evaluate` without the app exposing anything else.
 */
import {
  type CtxCounter,
  type CtxCounterSnapshot,
  startCtxCounter,
} from './ctx-counter.ts';
import {
  type FrameTimingStats,
  type RepaintEvents,
  startFrameTimingRecorder,
} from './frame-timing.ts';
import { type SceneGraph, type SceneOptions, buildScene } from './scene.ts';

export const PERF_TOOLS_GLOBAL = '__graphPerf';

export type PerfReport = {
  timing: FrameTimingStats;
  calls?: CtxCounterSnapshot;
};

export type PerfTools = {
  /** build a deterministic graph of a given size to measure against */
  scene: (options: SceneOptions) => void;
  /**
   * start tallying canvas calls. left off until asked for, since the patching
   * it does adds overhead to every draw in every dev session
   */
  countCalls: () => void;
  report: () => PerfReport;
  /** drop every sample collected so far. call after changing the scene */
  reset: () => void;
  stop: () => void;
};

export const startPerfTools = (
  graph: SceneGraph,
  repaintEvents: RepaintEvents,
): PerfTools => {
  const timing = startFrameTimingRecorder(repaintEvents);
  let counter: CtxCounter | undefined;

  const tools: PerfTools = {
    scene: (options) => {
      buildScene(graph, options);
      timing.reset();
      counter?.reset();
    },
    countCalls: () => {
      if (counter) return;
      counter = startCtxCounter(repaintEvents);
    },
    report: () => ({
      timing: timing.stats(),
      calls: counter?.snapshot(),
    }),
    reset: () => {
      timing.reset();
      counter?.reset();
    },
    stop: () => {
      timing.stop();
      counter?.stop();
      delete (globalThis as Record<string, unknown>)[PERF_TOOLS_GLOBAL];
    },
  };

  (globalThis as Record<string, unknown>)[PERF_TOOLS_GLOBAL] = tools;

  return tools;
};
