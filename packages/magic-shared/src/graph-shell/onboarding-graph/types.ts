import { ReadonlyEventHub } from '@core/events/createEventHub';

import { ComponentControls } from '../../component-slot/useComponent.ts';
import { AddGEdgeOptions, AddGNodeOptions } from '../../graph/types.ts';
import { OnboardingGraphEventMap } from './events.ts';

/** the nodes and edges of an onboarding graph, positioned in offsets from screen center */
export type OnboardingGraphElements = {
  nodes: AddGNodeOptions[];
  edges: AddGEdgeOptions[];
};

/** how the product wants its onboarding graph presented */
export type OnboardingGraphOptions = {
  /** label on the button that builds the graph */
  buildButtonText: string;
};

/** an onboarding graph a product offers to build */
export type OnboardingGraph = OnboardingGraphElements & {
  options?: Partial<OnboardingGraphOptions>;
};

export type OnboardingGraphControls = ComponentControls & {
  events: ReadonlyEventHub<OnboardingGraphEventMap>;
  /** builds the onboarding graph, replacing the current nodes and edges */
  build: () => void;
  /** the product's options with the defaults filled in */
  options: OnboardingGraphOptions;
};
