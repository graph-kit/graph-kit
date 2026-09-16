export type Scenario = {
  /** shows up as the table heading in the bot's comment */
  name: string;
  /** route to measure, relative to the server root */
  route: string;
  nodes: number;
  /**
   * a sweeping cursor exercises hit testing and everything downstream of it,
   * which an idle page never touches at all
   */
  sweepCursor?: boolean;
};

/** every scene is built from the same seed, so runs differ only by the code */
export const SCENE_SEED = 1;

/** ~180 frames at 60fps, enough for per frame averages to stop moving */
export const MEASURE_MS = 3000;

const ROUTE = '/dev';

export const scenarios: Scenario[] = [
  { name: 'idle-10', route: ROUTE, nodes: 10 },
  { name: 'idle-25', route: ROUTE, nodes: 25 },
  { name: 'idle-50', route: ROUTE, nodes: 50 },
  { name: 'hover-25', route: ROUTE, nodes: 25, sweepCursor: true },
];
