import { Graph } from '../graph/types.ts';
import { UseGraphOptions } from '../graph/useGraph.ts';
import { ShellFlagOptions } from '../product/flags.ts';
import { ProductId } from '../product/manifests/index.ts';
import { SimulationButtonDefinition } from '../simulation/start-buttons/types.ts';
import { LensChipDefinition } from '../ui/lens-chips/types.ts';

export type GraphLensChipOption = (
  graph: Graph,
) => LensChipDefinition[] | undefined;

export type GraphSimulationButtonOption = (
  graph: Graph,
) => SimulationButtonDefinition[] | undefined;

export type GraphShellOptions = UseGraphOptions & {
  /** selects the manifest describing this product */
  productId: ProductId;
  /** conditionally disable/enable shell features */
  flags?: ShellFlagOptions;
  /** builds the lens chips shown above the canvas, if the product offers any */
  lensChips?: GraphLensChipOption;
  /** builds the simulation buttons shown below the canvas, if the product offers any */
  simulationButtons?: GraphSimulationButtonOption;
};
