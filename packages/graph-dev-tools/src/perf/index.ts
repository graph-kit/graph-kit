/**
 * Performance tooling for the canvas render loop, driven by the perf harness.
 *
 * Registers itself on a global so the harness can reach it through
 * `page.evaluate` without the app exposing anything else.
 */
import {
  type CtxCounter,
  type CtxCounterSnapshot,
  type RepaintEvents,
  startCtxCounter,
} from './ctx-counter.ts';
import { type SceneGraph, type SceneOptions, buildScene } from './scene.ts';

export const PERF_TOOLS_GLOBAL = '__graphPerf';

export type PerfReport = {
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

const globalSlot = <T>(key: string) => {
  const scope = globalThis as Record<string, unknown>;
  return {
    set: (value: T) => {
      scope[key] = value;
    },
    clear: () => {
      delete scope[key];
    },
  };
};

const perfToolsGlobal = globalSlot<PerfTools>(PERF_TOOLS_GLOBAL);

export const startPerfTools = (
  graph: SceneGraph,
  repaintEvents: RepaintEvents,
): PerfTools => {
  let counter: CtxCounter | undefined;

  const tools: PerfTools = {
    scene: (options) => {
      buildScene(graph, options);
      counter?.reset();
    },
    countCalls: () => {
      if (counter) return;
      counter = startCtxCounter(repaintEvents);
    },
    report: () => ({ calls: counter?.snapshot() }),
    reset: () => counter?.reset(),
    stop: () => {
      counter?.stop();
      perfToolsGlobal.clear();
    },
  };

  perfToolsGlobal.set(tools);

  return tools;
};
