import { assert } from '@core/utils/assert';

import { type ProductId, manifests } from './index.ts';

export const isProductId = (id: unknown): id is ProductId =>
  typeof id === 'string' && id in manifests;

export function assertIsProductId(
  id: unknown,
  message = `"${id}" is not a product id`,
): asserts id is ProductId {
  assert(isProductId(id), message);
}
