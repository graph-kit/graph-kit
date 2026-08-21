import { navigateTo } from 'nuxt/app';

import { ProductId, manifests } from '../../product/index.ts';
import { MagicProductManifest } from '../../product/manifests/types.ts';
import { queryString } from '../../url/index.ts';

/**
 * source of truth for how a product's slug becomes a url. `extraParams` is for a link
 * carrying something across the load, since a product change is a document load here
 */
export const productHref = (
  product: MagicProductManifest,
  extraParams?: Record<string, string>,
) => `/${product.navigation.slug}${queryString(extraParams)}`;

/** for moves the user did not click a link to make, like a collaborator pulling them across */
export const navigateToProduct = (productId: ProductId) => {
  navigateTo(productHref(manifests[productId]));
};
