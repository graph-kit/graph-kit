import { nullThrows } from '@core/utils/assert';

import { inject, provide } from 'vue';

import { Magic } from './types.ts';

const MAGIC_KEY = 'MAGIC_PRODUCT';

export const provideMagic = (magic: Magic) => {
  provide(MAGIC_KEY, magic);
};

export const useProvidedMagic = () => {
  return nullThrows(inject<Magic>(MAGIC_KEY), 'magic not provided!');
};
