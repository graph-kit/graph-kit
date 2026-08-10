export { default as MagicProduct } from './MagicProduct.vue';

// the harness, host agnostic
export { useMagicProduct } from './useMagicProduct.ts';
export type {
  HistoryField,
  Magic,
  MagicProductHost,
  MagicProductOptions,
  TransitField,
} from './types.ts';

export { useGraphProduct } from './useGraphProduct.ts';
export type {
  GraphLensChipOption,
  GraphProductOptions,
  MagicGraph,
} from './types.ts';

export {
  provideGraph,
  provideMagic,
  useProvidedGraph,
  useProvidedMagic,
  useProvidedMagicGraph,
} from './context.ts';

export { manifests, products } from './manifests/index.ts';
export type { ProductId } from './manifests/index.ts';
export type {
  MagicProductCard,
  MagicProductManifest,
  MagicProductNavigation,
  Thumbnail,
} from './manifests/types.ts';
