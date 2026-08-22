<script setup lang="ts">
  import {
    ToastPortal,
    ToastProvider,
    type ToastProviderProps,
    ToastViewport,
  } from 'reka-ui';

  import { computed, ref, useAttrs } from 'vue';

  import { cn } from '../../cn.ts';
  import { useAttrClass } from '../../composables/useAttrClass.ts';
  import { useStackShift } from './useStackShift.ts';

  defineOptions({ inheritAttrs: false });

  interface Props {
    /** what a screen reader calls the region the toasts land in */
    label?: string;
    swipeDirection?: ToastProviderProps['swipeDirection'];
  }

  withDefaults(defineProps<Props>(), {
    label: 'Notification',
    swipeDirection: 'right',
  });

  const attrs = useAttrs();

  const attrClass = useAttrClass();

  const base =
    'pointer-events-none fixed top-6 right-6 z-50 m-0 flex w-fit list-none flex-col gap-2 p-0 outline-none';

  const classes = computed(() => cn(base, attrClass.value));

  const viewportRef = ref<{ $el?: HTMLElement }>();

  useStackShift(computed(() => viewportRef.value?.$el));
</script>

<template>
  <!--
    each toast teleports itself into the viewport, so the slot only has to sit inside
    the provider. the viewport takes no pointer events of its own, since it spans more
    than the cards it holds and would otherwise swallow clicks meant for what is behind
  -->
  <ToastProvider
    :label="label"
    :swipe-direction="swipeDirection"
  >
    <slot />
    <ToastPortal>
      <ToastViewport
        ref="viewportRef"
        v-bind="{ ...attrs, class: undefined }"
        :class="classes"
      />
    </ToastPortal>
  </ToastProvider>
</template>
