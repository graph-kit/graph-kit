export type Scenario = {
  /** shows up as the table heading in the bot's comment */
  name: string;
  /** number of nodes rendered */
  nodes: number;
  /** set to `true` to simulate a cursor sweeping over the canvas */
  sweepCursor?: boolean;
};

/** ~180 frames at 60fps, enough for per frame averages to stop moving */
export const MEASURE_MS = 3000;

export const scenarios: Scenario[] = [
  { name: 'idle-10', nodes: 10 },
  { name: 'idle-25', nodes: 25 },
  { name: 'idle-50', nodes: 50 },
  { name: 'hover-25', nodes: 25, sweepCursor: true },
];
