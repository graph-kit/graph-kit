import { ReadonlyEventHub } from '@core/events/createEventHub';

import { ComponentControls } from '../../component-slot/useComponent.ts';
import { AddGEdgeOptions, AddGNodeOptions } from '../../graph/types.ts';
import { OnboardingGraphEventMap } from './events.ts';

/** a starting graph a product offers to build, positioned in offsets from screen center */
export type OnboardingGraph = {
  nodes: AddGNodeOptions[];
  edges: AddGEdgeOptions[];
};

export type OnboardingGraphControls = ComponentControls & {
  events: ReadonlyEventHub<OnboardingGraphEventMap>;
  /** builds the starting graph over whatever the canvas is holding */
  build: () => void;
};
