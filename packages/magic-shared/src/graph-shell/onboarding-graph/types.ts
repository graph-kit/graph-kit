import { ReadonlyEventHub } from '@core/events/createEventHub';

import { ComponentControls } from '../../component-slot/useComponent.ts';
import { AddGEdgeOptions, AddGNodeOptions } from '../../graph/types.ts';
import { OnboardingGraphEventMap } from './events.ts';

/** an onboarding graph a product offers to build, positioned in offsets from screen center */
export type OnboardingGraph = {
  nodes: AddGNodeOptions[];
  edges: AddGEdgeOptions[];
};

export type OnboardingGraphControls = ComponentControls & {
  events: ReadonlyEventHub<OnboardingGraphEventMap>;
  /** builds the onboarding graph, replacing the current nodes and edges */
  build: () => void;
};
