import { computed, onMounted, onUnmounted, ref } from 'vue';

import { Magic } from '../types.ts';

export const useDisablePointerEvents = (magic: Magic) => {
  const disableUIPointerEvents = ref(false);

  /*
    the slots opt back into pointer events one by one rather than inheriting
    them, because the layer they sit in covers the whole canvas so it can clip
    the panels that animate past the edge. that makes this an explicit
    'auto' instead of an empty string: a layer that never takes events cannot
    hand them down
  */
  const pointerEvents = computed(() =>
    disableUIPointerEvents.value
      ? 'pointer-events-none'
      : 'pointer-events-auto',
  );

  const stopPointerEvents = () => (disableUIPointerEvents.value = true);
  const startPointerEvents = () => (disableUIPointerEvents.value = false);

  onMounted(() => {
    magic.surface.domEvents.subscribe('onMouseDown', stopPointerEvents);
    magic.surface.domEvents.subscribe('onMouseUp', startPointerEvents);
  });

  onUnmounted(() => {
    magic.surface.domEvents.unsubscribe('onMouseDown', stopPointerEvents);
    magic.surface.domEvents.unsubscribe('onMouseUp', startPointerEvents);
  });

  return pointerEvents;
};
