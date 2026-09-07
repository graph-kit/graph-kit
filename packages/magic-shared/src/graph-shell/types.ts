import { MaybeGetter } from '@core/utils/maybeGetter/index';
import Fraction from 'fraction.js';

import { GNode, Graph } from '../graph/types.ts';
import { UseGraphOptions } from '../graph/useGraph.ts';
import { ShellFlagOptions } from '../product/flags.ts';
import { ProductId } from '../product/manifests/index.ts';
import { Shell } from '../product/types.ts';
import { SimulationButtonDefinition } from '../simulation/start-buttons/types.ts';
import { HelpMenuItem } from '../ui/help-menu/types.ts';
import { LensChipDefinition } from '../ui/lens-chips/types.ts';

export type GraphLensChipOption = (
  graph: Graph,
  shell: Shell,
) => LensChipDefinition[] | undefined;

export type GraphSimulationButtonOption = (
  graph: Graph,
) => SimulationButtonDefinition[] | undefined;

type OnboardingNode = {
  id: string;
  label: string;
  position: { x: number; y: number };
};

type OnboardingEdge = {
  source: string;
  target: string;
  weight?: Fraction;
};

type OnboardingGraph = {
  nodes: OnboardingNode[];
  edges: OnboardingEdge[];
};

export type GraphShellOptions = UseGraphOptions & {
  /** the manifest describing this product */
  productId: ProductId;
  /** conditionally disable/enable shell features */
  flags?: ShellFlagOptions;
  /** what this product adds to the help menu beyond its shortcuts */
  helpMenu?: MaybeGetter<HelpMenuItem[]>;
  /** builds the lens chips shown above the canvas, if the product offers any */
  lensChips?: GraphLensChipOption;
  /** builds the simulation buttons shown below the canvas, if the product offers any */
  simulationButtons?: GraphSimulationButtonOption;
  onboardingGraph?: OnboardingGraph;
};
