/**
 * Opt in performance tooling for the canvas render loop.
 *
 * Strictly opt in, like the getters audit next door: start and stop it yourself,
 * nothing wires it in for you. Meant to be driven from the console during a
 * profiling session, or from a driver script if the numbers ever get automated.
 *
 * @example
 * // in a product's setup, behind import.meta.env.DEV
 * startPerfTools(graph, graph.surface.magicCanvas.lifecycleEvents);
 *
 * // then, in the console
 * __graphPerf.scene({ nodes: 25 })
 * __graphPerf.report()
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
   * start tallying canvas calls. left off by default: the patching it does adds
   * overhead to every draw, so timings taken with it running are not comparable
   * to timings taken without it. measure one at a time
   */
  countCalls: () => void;
  /** current numbers, also logged to the console for a profiling session */
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

  const report = (): PerfReport => {
    const result: PerfReport = {
      timing: timing.stats(),
      calls: counter?.snapshot(),
    };

    console.table({
      'fps (from median interval)': result.timing.fps.toFixed(1),
      'interval p50 (ms)': result.timing.interval.p50.toFixed(2),
      'interval p95 (ms)': result.timing.interval.p95.toFixed(2),
      'draw p50 (ms)': result.timing.draw.p50.toFixed(2),
      'draw p95 (ms)': result.timing.draw.p95.toFixed(2),
      'draw max (ms)': result.timing.draw.max.toFixed(2),
      'dropped frames': result.timing.dropped,
      frames: result.timing.frames,
    });

    if (result.calls) console.table(result.calls.perFrame);

    return result;
  };

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
    report,
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

  // reachable from a console or a driver script without threading a ref anywhere
  (globalThis as Record<string, unknown>)[PERF_TOOLS_GLOBAL] = tools;

  return tools;
};
