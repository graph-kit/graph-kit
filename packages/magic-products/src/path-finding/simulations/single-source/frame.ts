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
};

type SafeToSettleFrame = {
  type: 'safe-to-settle';
  node: GNode['id'];
  distance: Fraction;
  runnerUp?: FrontierEntry;
};

type SettleNodeFrame = {
  type: 'settle-node';
  node: GNode['id'];
  distance: Fraction;
};

type StillTentativeFrame = {
  type: 'still-tentative';
  waiting: readonly FrontierEntry[];
  /**
   * the node just settled, carried with its cost since that is the reason the
   * others are still open: it is cheaper than they are, so edges out of it can
   * still land under them
   */
  via: FrontierEntry;
};

type ExploreNodeFrame = {
  type: 'explore-node';
  node: GNode['id'];
  distance: Fraction;
  /**
   * the edges about to be followed, in the order they will be. arcs rather than
   * neighbours: a parallel pair is two edges to check, and an undirected edge
   * is one of them from whichever end the walk arrives at
   */
  edges: readonly GEdge['id'][];
  basePath: readonly GEdge['id'][];
};

type SkipSettledFrame = {
  type: 'skip-settled';
  edge: GEdge['id'];
  node: GNode['id'];
  distance: Fraction;
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
  /** the node the cheaper route arrives from, and what it already cost to stand there */
  via: GNode['id'];
  base: Fraction;
  /**
   * the edges of the route to `via`, which is the half of the sum `base` names.
   * the route the new distance takes is this plus `edge`, so both numbers in
   * the sentence can be hovered as paths rather than read as bare totals
   */
  basePath: readonly GEdge['id'][];
  /** the edge that closes the new route, whose weight is added to the base */
  edge: GEdge['id'];
  /**
   * the edges of the route the old distance came from, empty when there was
   * none. the number being beaten is a sum too, and a reader who cannot see
   * what it was made of has nothing to weigh the new one against
   */
  oldPath: readonly GEdge['id'][];
};

type KeepDistanceFrame = {
  type: 'keep-distance';
  node: GNode['id'];
  distance: Fraction;
  offered: Fraction;
  /** the edge that would have closed the offered route, whose weight `offered` ends with */
  edge: GEdge['id'];
  /** the edges of the route to the node the offer came from, so `offered` is this plus `edge` */
  basePath: readonly GEdge['id'][];
  /**
   * the edges of the route `distance` came from, the one the offer failed to
   * beat. the two routes are the whole comparison, so both are worth pointing at
   */
  currentPath: readonly GEdge['id'][];
};

type UnreachableFrame = {
  type: 'unreachable';
  nodes: readonly GNode['id'][];
};

type BeginPassFrame = {
  type: 'begin-pass';
  pass: number;
  totalPasses: number;
};

type PassSettledFrame = {
  type: 'pass-settled';
  pass: number;
};

type NegativeCycleFrame = {
  type: 'negative-cycle';
  node: GNode['id'];
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
};

export type SingleSourceFrame = SingleSourceStep &
  SingleSourceState &
  SingleSourceHighlights;
