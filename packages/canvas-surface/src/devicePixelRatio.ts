import { getDevicePixelRatio } from '@core/utils/canvas/index';

import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

export const useDevicePixelRatio = () => {
  const dpr = ref(1);

  let query: MediaQueryList | undefined;

  const stopWatching = () => {
    query?.removeEventListener('change', rearm);
    query = undefined;
  };

  const rearm = () => {
    stopWatching();
    dpr.value = getDevicePixelRatio();
    query = window.matchMedia(`(resolution: ${dpr.value}dppx)`);
    query.addEventListener('change', rearm);
  };

  onMounted(rearm);
  onBeforeUnmount(stopWatching);

  return computed(() => dpr.value);
};
