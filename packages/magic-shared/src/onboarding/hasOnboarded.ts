import { readLocalStorage, writeLocalStorage } from '@core/utils/localStorage';

const HAS_ONBOARDED_LOCAL_KEY = 'has-onboarded';

export const hasOnboarded = () =>
  readLocalStorage(HAS_ONBOARDED_LOCAL_KEY) === 'true';

export const markOnboarded = () =>
  writeLocalStorage(HAS_ONBOARDED_LOCAL_KEY, 'true');
