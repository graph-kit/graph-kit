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

export type { ProductFlagOptions, ProductFlags } from './flags.ts';

export { provideMagic, useProvidedMagic } from './context.ts';

export { manifests, products } from './manifests/index.ts';
export { productThumbnail } from './manifests/thumbnail.ts';
export type { ProductId } from './manifests/index.ts';
export type {
  MagicProductCard,
  MagicProductManifest,
  MagicProductNavigation,
  Thumbnail,
} from './manifests/types.ts';
