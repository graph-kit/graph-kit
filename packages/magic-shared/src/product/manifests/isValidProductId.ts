import { assert } from '@core/utils/assert';

import { type ProductId, manifests } from './index.ts';

export function assertIsProductId(
  id: string,
  message = `"${id}" is not a product id`,
): asserts id is ProductId {
  assert(id in manifests, message);
}
