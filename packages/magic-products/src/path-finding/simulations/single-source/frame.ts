import { GEdge, GNode, Graph } from '@magic/shared/graph';
import { FrameCollectorFn } from '@magic/shared/simulation/types';
import Fraction from 'fraction.js';

import { Distance, DistanceRow } from '../distance.ts';

export type SingleSourceFunction = (
  graph: Graph,
  sourceNodeId: GNode['id'],
) => FrameCollectorFn<SingleSourceFrame>;

type StartFrame = {
  type: 'start';
  source: GNode['id'];
};

type EndFrame = {
  type: 'end';
};

type FrontierEntry = {
  node: GNode['id'];
  distance: Fraction;
  // the edges of the route the distance arrived on.
  path: readonly GEdge['id'][];
};

type SafeToSettleFrame = {
  type: 'safe-to-settle';
  node: GNode['id'];
  distance: Fraction;
  path: readonly GEdge['id'][];
  runnerUp?: FrontierEntry;
};

type SettleNodeFrame = {
  type: 'settle-node';
  node: GNode['id'];
  distance: Fraction;
  path: readonly GEdge['id'][];
};

type StillTentativeFrame = {
  type: 'still-tentative';
  waiting: readonly FrontierEntry[];
  // the node it went through to desitination
  via: FrontierEntry;
};

type ExploreNodeFrame = {
  type: 'explore-node';
  node: GNode['id'];
  distance: Fraction;
  /** the edges about to be followed, in the order they will be */
  edges: readonly GEdge['id'][];
  basePath: readonly GEdge['id'][];
};

type SkipSettledFrame = {
  type: 'skip-settled';
  edge: GEdge['id'];
  node: GNode['id'];
  distance: Fraction;
  /** the edges of the finalized route `distance` arrived on */
  path: readonly GEdge['id'][];
};

type RelaxEdgeFrame = {
  type: 'relax-edge';
  edge: GEdge['id'];
  from: GNode['id'];
  to: GNode['id'];
  base: Fraction;
  offered: Fraction;
};

type ImproveDistanceFrame = {
  type: 'improve-distance';
  node: GNode['id'];
  oldDistance: Distance;
  newDistance: Fraction;
  /** the node the cheaper route arrives from */
  via: GNode['id'];
  base: Fraction;
  /**
   * the edges of the route to `via`
   */
  basePath: readonly GEdge['id'][];
  /** the edge that closes the new route */
  edge: GEdge['id'];
  oldPath: readonly GEdge['id'][];
};

type KeepDistanceFrame = {
  type: 'keep-distance';
  node: GNode['id'];
  distance: Fraction;
  offered: Fraction;
  /** the edge that would have closed the offered route */
  edge: GEdge['id'];
  /** the edges of the route to the node the offer came from*/
  basePath: readonly GEdge['id'][];
  // edges the distance value came from
  currentPath: readonly GEdge['id'][];
};

type SkipUnreachableFrame = {
  type: 'skip-unreachable';
  edge: GEdge['id'];
  from: GNode['id'];
  to: GNode['id'];
};

type BeginVerificationFrame = {
  type: 'begin-verification';
  passesDone: number;
  nodeCount: number;
};

type VerifyEdgeFrame = {
  type: 'verify-edge';
  edge: GEdge['id'];
  from: GNode['id'];
  to: GNode['id'];
  /** what the route through `from` offers, which has to lose to `current` */
  offered: Fraction;
  current: Fraction;
  /** the edges of the route `current` arrived on */
  currentPath: readonly GEdge['id'][];
};

type NoNegativeCycleFrame = {
  type: 'no-negative-cycle';
};

type UnreachableFrame = {
  type: 'unreachable';
  nodes: readonly GNode['id'][];
};

type BeginPassFrame = {
  type: 'begin-pass';
  pass: number;
  totalPasses: number;
  /** carried so the pass count can be argued for without reading the graph */
  nodeCount: number;
};

type PassSettledFrame = {
  type: 'pass-settled';
  pass: number;
};

type NegativeCycleFrame = {
  type: 'negative-cycle';
  node: GNode['id'];
  /** the edge that still improves node, which is the proof there is a cycle */
  edge: GEdge['id'];
  loop?: {
    edges: readonly GEdge['id'][];
    lapCost: Fraction;
  };
};

export type SingleSourceStep =
  | StartFrame
  | EndFrame
  | SafeToSettleFrame
  | SettleNodeFrame
  | StillTentativeFrame
  | ExploreNodeFrame
  | SkipSettledFrame
  | RelaxEdgeFrame
  | ImproveDistanceFrame
  | KeepDistanceFrame
  | UnreachableFrame
  | SkipUnreachableFrame
  | BeginVerificationFrame
  | VerifyEdgeFrame
  | NoNegativeCycleFrame
  | BeginPassFrame
  | PassSettledFrame
  | NegativeCycleFrame;

/**
 * the state every single source frame carries, because both algorithms rebuild
 * all of it before every step. required rather than optional so a panel reading
 * a frame does not have to ask whether the run it is watching has a table yet
 */
type SingleSourceState = {
  /** the distance from the source to every node */
  distances: DistanceRow;
  /** the node the user picked to measure every distance from */
  anchorNodeId: GNode['id'];
  /** the edges that make up the best paths known so far */
  treeEdgeIds: readonly GEdge['id'][];
};

/**
 * what is being looked at this frame rather than what is known. optional
 * because it varies step to step, and because bellman ford has no frontier to
 * put in `pendingNodeIds` at all
 */
export type SingleSourceHighlights = {
  /** the node the algorithm is standing on this frame */
  activeNodeId?: GNode['id'];
  /** nodes whose distance is being weighed this frame, but not yet changed */
  candidateNodeIds?: readonly GNode['id'][];
  /** nodes whose distance can no longer improve */
  settledNodeIds?: readonly GNode['id'][];
  /** nodes with a tentative distance, waiting in the frontier */
  pendingNodeIds?: readonly GNode['id'][];
  /** edges whose weight is being tested this frame */
  relaxingEdgeIds?: readonly GEdge['id'][];
  /** edges tested this frame that offered nothing better than what we had */
  rejectedEdgeIds?: readonly GEdge['id'][];
  /** nodes on a cycle that gets cheaper every lap */
  cycleNodeIds?: readonly GNode['id'][];
  /** the edges of that cycle */
  cycleEdgeIds?: readonly GEdge['id'][];
};

/** what an edge turned out to do when the sweep reached it */
export type SweepOutcome = 'improved' | 'kept' | 'skipped';

/**
 * the pass underway and how far through the edge list it has got. only bellman
 * ford has one: dijkstra follows the edges leaving one node at a time rather
 * than sweeping the whole list, so it leaves this off entirely and the panel
 * stays away.
 *
 * nested rather than spread across the frame because the parts are worth
 * nothing apart: a position with no list to index, or an outcome with no sweep
 * it belongs to, is not a state any panel could draw
 */
export type SingleSourceSweep = {
  sweep?: {
    /** every edge of the sweep, in the order it visits them */
    edgeIds: readonly GEdge['id'][];
    /** how many are done, the one on screen included */
    position: number;
    /** which pass this is, absent for the extra sweep that checks for a cycle */
    pass?: number;
    /** how many passes the run will make at most */
    totalPasses: number;
    /** what each edge did, for the ones the sweep has reached so far */
    outcomes: Partial<Record<GEdge['id'], SweepOutcome>>;
  };
};

export type SingleSourceFrame = SingleSourceStep &
  SingleSourceState &
  SingleSourceHighlights &
  SingleSourceSweep;
