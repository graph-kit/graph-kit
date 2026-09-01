<script setup lang="ts">
  import {
    PopoverContent,
    type PopoverContentProps,
    PopoverPortal,
    PopoverRoot,
    PopoverTrigger,
  } from 'reka-ui';

  import { computed, ref, useAttrs } from 'vue';

  import { cn } from '../../cn.ts';
  import { useAttrClass } from '../../composables/useAttrClass.ts';

  defineOptions({ inheritAttrs: false });

  interface Props {
    side?: PopoverContentProps['side'];
    align?: PopoverContentProps['align'];
    /** the gap the panel keeps from its trigger */
    sideOffset?: PopoverContentProps['sideOffset'];
  }

  withDefaults(defineProps<Props>(), {
    side: 'bottom',
    align: 'start',
    sideOffset: 6,
  });

  /** left unbound the panel opens and closes itself, driven by the trigger slot */
  const open = defineModel<boolean>('open', { default: false });

  const panel =
    'z-50 rounded-md border border-neutral-200 bg-white p-1 shadow-md outline-none transition-[opacity,scale] duration-150 ease-[cubic-bezier(0.34,1.4,0.64,1)] starting:opacity-0 starting:scale-95';

  const attrs = useAttrs();

  const attrClass = useAttrClass();

  const classes = computed(() => cn(panel, attrClass.value));

  // closing hands focus back to the trigger, which a pointer user reads as a stray
  // tooltip and focus ring; only a keyboard has nowhere else to land
  const usingPointer = ref(false);

  const keepFocusPut = (event: Event) => {
    if (usingPointer.value) event.preventDefault();
  };

  defineSlots<{
    default: () => unknown;
    trigger: () => unknown;
  }>();
</script>

<template>
  <!-- non-modal, so the panel behaves like canvas chrome: the click that dismisses it
       still reaches whatever sits underneath -->
  <PopoverRoot v-model:open="open">
    <PopoverTrigger as-child>
      <slot name="trigger" />
    </PopoverTrigger>
    <PopoverPortal>
      <PopoverContent
        :side="side"
        :align="align"
        :side-offset="sideOffset"
        v-bind="{ ...attrs, class: undefined }"
        :class="classes"
        @pointerdown="usingPointer = true"
        @keydown="usingPointer = false"
        @pointer-down-outside="usingPointer = true"
        @open-auto-focus="usingPointer = false"
        @close-auto-focus="keepFocusPut"
      >
        <slot />
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>
