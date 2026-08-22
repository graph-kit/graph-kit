import { Component } from 'vue';

import { SimulationDefinition } from '../types.ts';

export type SimulationButtonDefinition = Partial<{
  definition: SimulationDefinition<any>;
  /** runs right after the user clicked and before the simulation begins */
  beforeStarting: () => void;
  disabled: () => string | false;
  render: Component;
}>;
