import { navigateTo } from 'nuxt/app';

import { ProductId } from '../../product/index.ts';
import { productPath } from '../../product/manifests/paths.ts';
import { queryString } from '../../url/index.ts';

/** source of truth for how a product's slug becomes a url */
export const productHref = (
  productId: string,
  extraParams: Record<string, string> = {},
) => `${productPath(productId)}${queryString(extraParams)}`;

/** for moves the user did not click a link to make, like a collaborator pulling them across */
export const navigateToProduct = (productId: ProductId) =>
  navigateTo(productHref(productId));
