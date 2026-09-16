/**
 * The slice of `window.__graphPerf` this harness drives, plus the shape it
 * writes to disk.
 *
 * Declared here rather than imported from `@graph/dev-tools` on purpose: the
 * harness runs against a server it did not build, which during a base
 * comparison is a checkout of a different commit. Sharing types across that
 * boundary would be pretending to a guarantee that does not exist.
 */

type PerfCounts = Record<string, number>;

export type PerfReport = {
  timing: {
    frames: number;
    interval: { p50: number; p95: number; max: number };
    draw: { p50: number; p95: number; max: number };
    dropped: number;
    fps: number;
  };
  calls?: {
    frames: number;
    total: PerfCounts;
    perFrame: PerfCounts;
  };
};

export type PerfTools = {
  scene: (options: { nodes: number }) => void;
  countCalls: () => void;
  report: () => PerfReport;
  reset: () => void;
};

export type ScenarioResult = {
  scenario: string;
  nodes: number;
  /** repaints observed during the measuring window */
  frames: number;
  /** canvas calls per frame, the number this whole thing exists to produce */
  perFrame: PerfCounts;
  timing: PerfReport['timing'];
};

export type RunResult = {
  /** commit the measured server was serving */
  commit: string;
  measuredAt: string;
  scenarios: ScenarioResult[];
};
