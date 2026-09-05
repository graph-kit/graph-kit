import { nullThrows } from '@core/utils/assert';

import { inject, provide } from 'vue';

import { WelcomeScene } from './useWelcomeScene.ts';

const KEY = 'welcome-scene';

export const provideWelcomeScene = (scene: WelcomeScene) => {
  provide(KEY, scene);
};

export const useProvidedWelcomeScene = () =>
  nullThrows(inject<WelcomeScene>(KEY), 'welcome scene not provided!');
