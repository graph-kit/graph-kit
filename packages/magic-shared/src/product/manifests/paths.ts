import { manifests } from './index.ts';
import { assertIsProductId } from './isValidProductId.ts';
import { ProductManifest } from './types.ts';

/** the route a product is served at, the form the router and every internal link use */
export const productPath = (productId: string) => {
  assertIsProductId(productId);
  const product: ProductManifest = manifests[productId];
  return `/${product.navigation.slug}`;
};

/**
 * `productPath` with the trailing slash static hosting redirects to, so canonical tags
 * and sitemap entries name the destination rather than the redirect
 */
export const productCanonicalPath = (productId: string) => {
  const path = productPath(productId);
  return path.endsWith('/') ? path : `${path}/`;
};

/** whether search engines have been told to leave this product out of their index */
export const isProductIndexable = (productId: string) => {
  assertIsProductId(productId);
  const product: ProductManifest = manifests[productId];
  return !product.meta.robots?.includes('noindex');
};
