import { navigateTo } from 'nuxt/app';

import { ProductId, manifests } from '../../product/index.ts';
import { assertIsProductId } from '../../product/manifests/isValidProductId.ts';
import { queryString } from '../../url/index.ts';

/** source of truth for how a product's slug becomes a url */
export const productHref = (
  productId: string,
  extraParams: Record<string, string> = {},
) => {
  assertIsProductId(productId);
  return `/${manifests[productId].navigation.slug}${queryString(extraParams)}`;
};

/** for moves the user did not click a link to make, like a collaborator pulling them across */
export const navigateToProduct = (productId: ProductId) =>
  navigateTo(productHref(productId));
