import { getDevicePixelRatio } from '@core/utils/canvas/index';

import { onBeforeUnmount, onMounted, ref } from 'vue';

/**
 * `window.devicePixelRatio` as a live value. browser zoom and dragging the
 * window onto a display of a different density both move it mid session.
 *
 * the browser offers no event for the change, so this pins a media query to the
 * ratio last seen. that query stops matching the moment the ratio moves, and
 * the listener re-arms a fresh one against the new value.
 */
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

  return dpr;
};
