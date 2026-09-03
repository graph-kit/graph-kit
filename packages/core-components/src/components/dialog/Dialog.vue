<script setup lang="ts">
  import {
    DialogContent,
    DialogOverlay,
    DialogPortal,
    DialogRoot,
    DialogTitle,
    DialogTrigger,
    VisuallyHidden,
  } from 'reka-ui';

  import { computed, ref, useAttrs } from 'vue';

  import { cn } from '../../cn.ts';
  import { useAttrClass } from '../../composables/useAttrClass.ts';

  defineOptions({ inheritAttrs: false });

  interface Props {
    /** the heading the panel renders, and the accessible name screen readers announce */
    title: string;
    /**
     * whether the heading is drawn; the title is announced either way
     * @default true
     */
    showHeader?: boolean;
  }

  withDefaults(defineProps<Props>(), { showHeader: true });

  /** left unbound the dialog opens and closes itself, driven by the trigger slot */
  const open = defineModel<boolean>('open', { default: false });

  const attrs = useAttrs();

  const attrClass = useAttrClass();

  const panel =
    'fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-full max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-neutral-200 bg-white shadow-lg outline-none transition-[opacity,scale] duration-150 ease-[cubic-bezier(0.34,1.4,0.64,1)] starting:opacity-0 starting:scale-95';

  const classes = computed(() => cn(panel, attrClass.value));

  // closing hands focus back to the trigger, which a pointer user reads as a stray
  // tooltip and focus ring; only a keyboard has nowhere else to land
  const usingPointer = ref(false);

  const keepFocusPut = (event: Event) => {
    if (usingPointer.value) event.preventDefault();
  };

  // reka would ring the first control in the panel, and preventing focus outright
  // leaves it on the trigger, outside the trap
  const focusPanel = (event: Event) => {
    usingPointer.value = false;
    event.preventDefault();
    if (event.target instanceof HTMLElement)
      event.target.focus({ preventScroll: true });
  };

  defineSlots<{
    default?: () => unknown;
    /** absent for a dialog opened programmatically, which has nothing to hang off */
    trigger?: () => unknown;
  }>();
</script>

<template>
  <DialogRoot v-model:open="open">
    <DialogTrigger
      v-if="$slots.trigger"
      as-child
    >
      <slot name="trigger" />
    </DialogTrigger>
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-50 bg-black/50" />
      <!--
        reka points the panel at a description element whether or not one exists and
        warns when it finds nothing there, so the panel says it has none
      -->
      <DialogContent
        v-bind="{ ...attrs, class: undefined, 'aria-describedby': undefined }"
        :class="classes"
        tabindex="-1"
        @pointerdown="usingPointer = true"
        @keydown="usingPointer = false"
        @pointer-down-outside="usingPointer = true"
        @open-auto-focus="focusPanel"
        @close-auto-focus="keepFocusPut"
      >
        <DialogTitle
          v-if="showHeader"
          class="text-lg font-bold"
        >
          {{ title }}
        </DialogTitle>
        <VisuallyHidden
          v-else
          as-child
        >
          <DialogTitle>{{ title }}</DialogTitle>
        </VisuallyHidden>
        <slot />
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
