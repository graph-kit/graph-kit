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
  edgeCount: number;
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
};

type KeepDistanceFrame = {
  type: 'keep-distance';
  node: GNode['id'];
  distance: Fraction;
  offered: Fraction;
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
