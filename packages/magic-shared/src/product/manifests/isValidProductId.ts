import { assert } from '@core/utils/assert';

import { type ProductId, manifests } from './index.ts';

export function assertIsProductId(
  id: unknown,
  message = `"${id}" is not a product id`,
): asserts id is ProductId {
  assert(typeof id === 'string' && id in manifests, message);
}
