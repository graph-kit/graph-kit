/** the dev playground, so numbers move with the graph and not with a product */
export const ROUTE = '/dev';

/** browser viewport size for every scene */
export const VIEWPORT = { width: 1440, height: 900 };

/** the rate canvas-surface caps repaints at */
const REPAINT_FPS = 60;

/** 3 seconds @ 60fps = 180 frames captured */
export const MEASURE_MS = 3000;

/** the same window as MEASURE_MS, in the frames the sweep advances the cursor across */
export const MEASURE_FRAMES = (MEASURE_MS / 1000) * REPAINT_FPS;

/** how long the sweep waits on any one frame before giving up */
export const FRAME_TIMEOUT_MS = 5_000;

/** how long to wait for the page to register its probe */
export const PROBE_TIMEOUT_MS = 30_000;

/** how long a scene gets to build */
export const SCENE_TIMEOUT_MS = 60_000;

/** how long a built scene gets to paint before measuring starts */
export const PAINT_TIMEOUT_MS = 5_000;
