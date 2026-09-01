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
  via: FrontierEntry;
};

type ExploreNodeFrame = {
  type: 'explore-node';
  node: GNode['id'];
  distance: Fraction;
  // the edges about to be followed, in the order they will be
  edges: readonly GEdge['id'][];
  basePath: readonly GEdge['id'][];
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
  via: GNode['id'];
  base: Fraction;
  // edge that creates new route
  edge: GEdge['id'];
  newPath: readonly GEdge['id'][];
  oldPath: readonly GEdge['id'][];
};

type KeepDistanceFrame = {
  type: 'keep-distance';
  node: GNode['id'];
  distance: Fraction;
  offered: Fraction;
  // edge that would have created new route
  edge: GEdge['id'];
  offeredPath: readonly GEdge['id'][];
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
  offered: Fraction;
  current: Fraction;
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
  nodeCount: number;
};

type PassSettledFrame = {
  type: 'pass-settled';
  pass: number;
};

type NegativeCycleFrame = {
  type: 'negative-cycle';
  node: GNode['id'];
  // edge that proves there is negative cycle
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

type SingleSourceState = {
  distances: DistanceRow;
  anchorNodeId: GNode['id'];
  // edges making up best path so far
  treeEdgeIds: readonly GEdge['id'][];
};

export type SingleSourceHighlights = {
  activeNodeId?: GNode['id'];
  candidateNodeIds?: readonly GNode['id'][];
  settledNodeIds?: readonly GNode['id'][];
  pendingNodeIds?: readonly GNode['id'][];
  relaxingEdgeIds?: readonly GEdge['id'][];
  rejectedEdgeIds?: readonly GEdge['id'][];
  // cycle means negative cycle
  cycleNodeIds?: readonly GNode['id'][];
  cycleEdgeIds?: readonly GEdge['id'][];
};

export type SweepOutcome = 'improved' | 'kept' | 'skipped';

export type SingleSourceSweep = {
  sweep?: {
    edgeIds: readonly GEdge['id'][];
    // what edge is being swept
    position: number;
    // what pass is it on
    pass?: number;
    totalPasses: number;
    outcomes: Partial<Record<GEdge['id'], SweepOutcome>>;
  };
};

export type SingleSourceFrame = SingleSourceStep &
  SingleSourceState &
  SingleSourceHighlights &
  SingleSourceSweep;
