<script setup lang="ts">
  import Dialog from '@core/components/Dialog';

  interface Props {
    title: string;
    /**
     * whether the core dialog draws the heading. off by default, since a caller laying
     * out its own panel wants the title where it puts it, not above everything
     */
    showHeader?: boolean;
  }

  withDefaults(defineProps<Props>(), { showHeader: false });

  const open = defineModel<boolean>('open', { default: false });

  defineSlots<{
    default?: () => unknown;
    /** absent for a dialog opened programmatically, see the core dialog */
    trigger?: () => unknown;
  }>();
</script>

<template>
  <Dialog
    class="bg-gray-300 border-gray-200 text-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
    :title="title"
    :show-header="showHeader"
    v-model:open="open"
  >
    <template
      v-if="$slots.trigger"
      #trigger
    >
      <slot name="trigger" />
    </template>
    <slot />
  </Dialog>
</template>
