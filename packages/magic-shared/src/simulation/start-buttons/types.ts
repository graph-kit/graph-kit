import { Component } from 'vue';

import { SimulationDefinition } from '../types.ts';

export type SimulationButtonDefinition = Partial<{
  definition: SimulationDefinition<any>;
  disabled: () => string | false;
  render: Component;
}>;
