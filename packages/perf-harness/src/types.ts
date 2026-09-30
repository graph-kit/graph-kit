/** one repaint's canvas calls keyed by call name, e.g. `fillRect` or `canvasElementsCreated` */
export type FrameCalls = Record<string, number>;

export type CanvasCallCounter = {
  /** starts recording each repaint's calls */
  start: () => void;
  /** each repaint since {@link CanvasCallCounter.start}, oldest first */
  get: () => FrameCalls[] | undefined;
  /**
   * how long each repaint took in milliseconds, in the same order as `get`. optional
   * because apps built before it existed don't have it
   */
  getPaintMs?: () => number[] | undefined;
};

export type CanvasScene = {
  /** move the cursor across the canvas while measuring, defaults to `false` */
  sweepCursor?: boolean;
  /** adds the scene to the page */
  build: () => void;
};

/** what the app registers on `window.__canvasCallProbe` for the harness to drive */
export type CanvasCallProbe = {
  /** the scenes this app can build, keyed by name */
  scenes: Record<string, CanvasScene>;
  counter: CanvasCallCounter;
};

declare global {
  interface Window {
    __canvasCallProbe?: CanvasCallProbe;
  }
}

export type SceneResult = {
  scene: string;
  frames: FrameCalls[];
  /** missing when the measured app predates paint timing */
  paintMs?: number[];
};

export type RunResult = {
  /** commit the measured server was serving */
  commit: string;
  measuredAt: string;
  scenes: SceneResult[];
};
