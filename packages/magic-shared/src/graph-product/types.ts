import { Graph } from '../graph/types.ts';
import { UseGraphOptions } from '../graph/useGraph.ts';
import { ProductId } from '../product/manifests/index.ts';
import { Magic } from '../product/types.ts';
import { LensChipDefinition } from '../ui/lens-chips/types.ts';
import { UIOptions } from '../ui/useProductUI.ts';

export type GraphLensChipOption = (
  graph: Graph,
) => LensChipDefinition[] | undefined;

export type GraphProductOptions = UseGraphOptions & {
  productId: ProductId;
  localStorage?: boolean;
  annotations?: boolean;
  lensChips?: GraphLensChipOption;
  ui?: UIOptions;
};

export type MagicGraph = Graph & {
  magic: Magic;
};
