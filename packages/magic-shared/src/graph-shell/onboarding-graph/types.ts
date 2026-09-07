import { Graph } from '../../graph/types.ts';

/** a starting graph a product offers to build, positioned in offsets from screen center */
export type OnboardingGraph = Parameters<Graph['actions']['addElements']>[0];
