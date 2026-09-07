import { readLocalStorage, writeLocalStorage } from '@core/utils/localStorage';

import { ProductId } from '../product/manifests/index.ts';

const localKey = (id: ProductId) => `has-onboarded-${id}`;

export const hasOnboarded = (id: ProductId) =>
  readLocalStorage(localKey(id)) === 'true';

export const markOnboarded = (id: ProductId) =>
  writeLocalStorage(localKey(id), 'true');
