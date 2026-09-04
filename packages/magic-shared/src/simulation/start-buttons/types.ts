import { Component } from 'vue';

import { DisabledLens } from '../../lens/types.ts';
import { SimulationDefinition } from '../types.ts';

export type SimulationButtonDefinition = Partial<{
  definition: SimulationDefinition<any>;
  /** button label. unused by buttons supplying their own `render` */
  name: string;
  /** runs right after the user clicked and before the simulation begins */
  beforeStarting: () => void;
  /** why the simulation cannot run, with an optional lens */
  disabled: () => DisabledLens | false;
  render: Component;
}>;

/** the slot the shell puts the button group in, so a lens can point at the buttons */
export const SIMULATION_BUTTONS_SLOT_ID = 'shell/simulation-buttons';
