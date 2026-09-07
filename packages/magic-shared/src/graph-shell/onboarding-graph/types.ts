import { AddGEdgeOptions, AddGNodeOptions } from '../../graph/types.ts';

/** a starting graph a product offers to build, positioned in offsets from screen center */
export type OnboardingGraph = {
  nodes: AddGNodeOptions[];
  edges: AddGEdgeOptions[];
};
