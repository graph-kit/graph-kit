<script setup lang="ts">
  import {
    DialogContent,
    DialogOverlay,
    DialogPortal,
    DialogRoot,
    DialogTitle,
    DialogTrigger,
  } from 'reka-ui';

  import { computed, useAttrs } from 'vue';

  import { cn } from '../../cn.ts';
  import { useAttrClass } from '../../composables/useAttrClass.ts';

  defineOptions({ inheritAttrs: false });

  interface Props {
    /** the heading the panel renders, and the accessible name screen readers announce */
    title: string;
  }

  defineProps<Props>();

  /** left unbound the dialog opens and closes itself, driven by the trigger slot */
  const open = defineModel<boolean>('open', { default: false });

  const attrs = useAttrs();

  const attrClass = useAttrClass();

  const panel =
    'fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-neutral-200 bg-white p-6 shadow-lg outline-none transition-[opacity,scale] duration-150 ease-[cubic-bezier(0.34,1.4,0.64,1)] starting:opacity-0 starting:scale-95';

  const classes = computed(() => cn(panel, attrClass.value));

  defineSlots<{
    default?: () => unknown;
    trigger: () => unknown;
  }>();
</script>

<template>
  <!-- modal, since a dialog worth interrupting for has nothing to gain from what it covers -->
  <DialogRoot v-model:open="open">
    <DialogTrigger as-child>
      <slot name="trigger" />
    </DialogTrigger>
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-50 bg-black/50" />
      <!--
        reka points the panel at a description element whether or not one exists and
        warns when it finds nothing there, so the panel says it has none. anything
        below the heading is the caller's, which owns its own description if it wants one
      -->
      <DialogContent
        v-bind="{ ...attrs, class: undefined, 'aria-describedby': undefined }"
        :class="classes"
      >
        <DialogTitle class="text-lg font-bold">{{ title }}</DialogTitle>
        <slot />
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
