<script setup lang="ts">
  import Tooltip from '@core/components/Tooltip';
</script>

<template>
  <Tooltip class="bg-gray-900 text-white dark:bg-gray-700">
    <template #trigger><slot name="trigger" /></template>
    <slot />
  </Tooltip>
</template>
