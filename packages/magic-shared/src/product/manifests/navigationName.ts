import { manifests } from './index.ts';
import { assertIsProductId } from './isValidProductId.ts';
import { ProductManifest } from './types.ts';

/** what to call a product on screen, falling back to its full name when it has no card */
export const getNavigationName = (productId: string): string => {
  assertIsProductId(productId);
  const product: ProductManifest = manifests[productId];
  return product.navigation.card?.name ?? product.name;
};
