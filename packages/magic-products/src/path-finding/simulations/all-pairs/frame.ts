import { GNode, Graph, GraphPath } from '@magic/shared/graph';
import { FrameCollectorFn } from '@magic/shared/simulation/types';
import Fraction from 'fraction.js';

import { Distance, DistanceMatrix } from '../distance.ts';
import { RouteTrail } from './routeTrail.ts';

export type AllPairsFunction = (
  graph: Graph,
) => FrameCollectorFn<AllPairsFrame>;

type StartFrame = {
  type: 'start';
};

type EndFrame = {
  type: 'end';
};

type ChoosePivotFrame = {
  type: 'choose-pivot';
  node: GNode['id'];
  pivotNumber: number;
  totalPivots: number;
};

type ConsiderPairFrame = {
  type: 'consider-pair';
  from: GNode['id'];
  to: GNode['id'];
  pivot: GNode['id'];
  currentDistance: Distance;
  currentRoute: GraphPath;
  detourDistance: Fraction;
  detourRoute: GraphPath;
};

type KeepPairFrame = {
  type: 'keep-pair';
  from: GNode['id'];
  to: GNode['id'];
  pivot: GNode['id'];
  currentDistance: Fraction;
  currentRoute: GraphPath;
  detourDistance: Fraction;
  detourRoute: GraphPath;
};

type ImprovePairFrame = {
  type: 'improve-pair';
  from: GNode['id'];
  to: GNode['id'];
  pivot: GNode['id'];
  previousDistance: Distance;
  previousRoute: GraphPath;
  detourDistance: Fraction;
  detourRoute: GraphPath;
};

type UnreachablePairsFrame = {
  type: 'unreachable';
  pairs: number;
  totalPairs: number;
};

type NegativeCycleFrame = {
  type: 'negative-cycle';
  node: GNode['id'];
  loop?: {
    edges: GraphPath;
    lapCost: Fraction;
  };
};

export type AllPairsStep =
  | StartFrame
  | EndFrame
  | ChoosePivotFrame
  | ConsiderPairFrame
  | KeepPairFrame
  | ImprovePairFrame
  | UnreachablePairsFrame
  | NegativeCycleFrame;

type AllPairsState = {
  matrix: DistanceMatrix;
  routes: RouteTrail;
};

export type AllPairsHighlights = {
  activeNodeId?: GNode['id'];
  candidateNodeIds?: readonly GNode['id'][];
  routeEdgeIds?: GraphPath;
  detourEdgeIds?: GraphPath;
  rejectedEdgeIds?: GraphPath;
  cycleNodeIds?: readonly GNode['id'][];
  cycleEdgeIds?: GraphPath;
};

export type AllPairsFrame = AllPairsStep & AllPairsState & AllPairsHighlights;
