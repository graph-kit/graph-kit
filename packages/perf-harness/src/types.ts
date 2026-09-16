/** canvas context method name (e.g. `fillRect`) to how many times it was called */
type PerfCounts = Record<string, number>;

type TimingSummary = { p50: number; p95: number; max: number };

export type PerfReport = {
  timing: {
    frameCount: number;
    frameIntervalMs: TimingSummary;
    drawDurationMs: TimingSummary;
    droppedFrameCount: number;
    medianFps: number;
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
