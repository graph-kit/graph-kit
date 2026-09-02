<script setup lang="ts">
  import Popover from '@core/components/Popover';

  // declared rather than left to fall through so a call site gets it type checked. no
  // defaults here: undefined lands on the core component's own, so they live once
  defineProps<{
    /** the gap the panel keeps from its trigger */
    sideOffset?: number;
  }>();

  defineSlots<{
    default: () => unknown;
    trigger: () => unknown;
  }>();
</script>

<template>
  <Popover
    class="bg-gray-300 border-gray-200 text-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
    :side-offset="sideOffset"
  >
    <template #trigger><slot name="trigger" /></template>
    <slot />
  </Popover>
</template>
