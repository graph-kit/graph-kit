<script setup lang="ts">
  import Dialog from '@core/components/Dialog';

  defineProps<{
    title: string;
    /** whether the heading is drawn, see the core dialog. @default true */
    showHeader?: boolean;
  }>();

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
