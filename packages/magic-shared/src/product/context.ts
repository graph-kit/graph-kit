import { nullThrows } from '@core/utils/assert';

import { inject, provide } from 'vue';

import { Shell } from './types.ts';

const SHELL_KEY = 'SHELL';

export const provideShell = (shell: Shell) => {
  provide(SHELL_KEY, shell);
};

export const useProvidedShell = () => {
  return nullThrows(inject<Shell>(SHELL_KEY), 'shell not provided!');
};
