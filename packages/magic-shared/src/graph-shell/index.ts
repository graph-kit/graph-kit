// the graph flavored half of the shell: everything that knows it is hosting a graph
export { useGraphShell } from './useGraphShell.ts';
export type {
  GraphLensChipOption,
  GraphSimulationButtonOption,
  GraphShellOptions,
} from './types.ts';

export { provideGraph, useProvidedGraph } from './context.ts';

export type { OnboardingItem } from './onboarding/index.ts';
