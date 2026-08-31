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

  import { computed, useAttrs } from 'vue';

  import { cn } from '../../cn.ts';
  import { useAttrClass } from '../../composables/useAttrClass.ts';

  defineOptions({ inheritAttrs: false });

  interface Props {
    /** the heading the panel renders, and the accessible name screen readers announce */
    title: string;
    /**
     * whether the heading is drawn. off, the title is still announced rather than
     * dropped: a dialog a screen reader cannot name is one nobody can tell apart
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
        <DialogTitle
          v-if="showHeader"
          class="text-lg font-bold"
        >
          {{ title }}
        </DialogTitle>
        <!-- as-child, so the name and what hides it are the one element -->
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
