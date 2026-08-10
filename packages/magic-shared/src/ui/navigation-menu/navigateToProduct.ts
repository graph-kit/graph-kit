import { navigateTo } from 'nuxt/app';

import { MagicProductManifest } from '../../product/manifests/types.ts';

/** source of truth for how a product's slug becomes a url */
export const navigateToProduct = (product: MagicProductManifest) =>
  navigateTo(`/${product.navigation.slug}`);
