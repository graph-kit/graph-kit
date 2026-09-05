import { nullThrows } from '@core/utils/assert';

import { inject, provide } from 'vue';

import { SetsState } from './types.ts';

const SETS_STATE_KEY = 'SETS_STATE';

export const provideSetsState = (state: SetsState) => {
  provide(SETS_STATE_KEY, state);
};

export const useProvidedSetsState = () => {
  return nullThrows(
    inject<SetsState>(SETS_STATE_KEY),
    'sets state not provided!',
  );
};
