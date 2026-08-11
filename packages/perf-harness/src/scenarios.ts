/**
 * What the perf bot measures.
 *
 * These live in the repo rather than in the workflow so that two runs are
 * comparable and a change to what gets measured is a reviewable diff.
 *
 * Sizes come in three because the useful question is usually the shape of the
 * curve rather than any single number: a cost that triples between 10 and 25
 * nodes is a different problem from one that doubles.
 */

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

/** long enough for the add animations to land, so a settling graph is not measured */
export const SETTLE_MS = 1500;

/** ~180 frames at 60fps, enough for per frame averages to stop moving */
export const MEASURE_MS = 3000;

/*
  the dev playground rather than a real product, so the numbers move when the graph
  itself does and not when a product adds a chip or a lens. it also persists nothing,
  which is what keeps one scenario from measuring the scene the last one left behind
*/
const ROUTE = '/dev';

export const scenarios: Scenario[] = [
  { name: 'idle-10', route: ROUTE, nodes: 10 },
  { name: 'idle-25', route: ROUTE, nodes: 25 },
  { name: 'idle-50', route: ROUTE, nodes: 50 },
  { name: 'hover-25', route: ROUTE, nodes: 25, sweepCursor: true },
];
