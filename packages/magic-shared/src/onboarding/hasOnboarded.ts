import { readLocalStorage, writeLocalStorage } from '@core/utils/localStorage';

import { OnboardingId } from './types.ts';

const localKey = (id: OnboardingId) => `has-onboarded-${id}`;

export const hasOnboarded = (id: OnboardingId) =>
  readLocalStorage(localKey(id)) === 'true';

export const markOnboarded = (id: OnboardingId) =>
  writeLocalStorage(localKey(id), 'true');
