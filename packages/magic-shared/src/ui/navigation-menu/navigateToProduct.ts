import { navigateTo } from 'nuxt/app';

import { MagicProductManifest } from '../../product/manifests/types.ts';
import { queryString } from '../../url/index.ts';

/** source of truth for how a product's slug becomes a url */
export const productHref = (product: MagicProductManifest) =>
  `/${product.navigation.slug}${queryString()}`;

/** for moves the user did not click a link to make, like a collaborator pulling them across */
export const navigateToProduct = (product: MagicProductManifest) =>
  navigateTo(productHref(product));
