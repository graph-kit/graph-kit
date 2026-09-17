/** the dev playground, so numbers move with the graph and not with a product */
export const ROUTE = '/dev';

/** browser viewport size for every scene */
export const VIEWPORT = { width: 1440, height: 900 };

/** 3 seconds @ 60fps = 180 frames captured */
export const MEASURE_MS = 3000;

/** how long to wait for the page to register its probe */
export const PROBE_TIMEOUT_MS = 30_000;

/** how long a scene gets to build */
export const SCENE_TIMEOUT_MS = 60_000;

/** how long a built scene gets to paint before measuring starts */
export const PAINT_TIMEOUT_MS = 5_000;
