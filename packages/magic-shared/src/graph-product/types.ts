import { Graph } from '../graph/types.ts';
import { UseGraphOptions } from '../graph/useGraph.ts';
import { ProductId } from '../product/manifests/index.ts';
import { Magic } from '../product/types.ts';
import { LensChipDefinition } from '../ui/lens-chips/types.ts';
import { ProductFlagOptions } from '../product/flags.ts';

export type GraphLensChipOption = (
  graph: Graph,
) => LensChipDefinition[] | undefined;

export type GraphProductOptions = UseGraphOptions & {
  /** selects the manifest describing this product */
  productId: ProductId;
  /** conditionally disable/enable magic product harness features */
  flags?: ProductFlagOptions;
  /** builds the lens chips shown above the canvas, if the product offers any */
  lensChips?: GraphLensChipOption;
};

export type MagicGraph = Graph & {
  magic: Magic;
};
