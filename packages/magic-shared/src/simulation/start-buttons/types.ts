import { SimulationDefinition } from '../types.ts';

export type SimulationButtonDefinition = {
  definition: SimulationDefinition<any>;
  disabled?: () => string | false;
};
