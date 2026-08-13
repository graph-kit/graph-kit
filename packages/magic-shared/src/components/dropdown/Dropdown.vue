<script setup lang="ts">
  import Dropdown from '@core/components/Dropdown';
</script>

<template>
  <Dropdown
    class="bg-gray-300 border-gray-200 text-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
  >
    <template #trigger><slot name="trigger" /></template>
    <slot />
  </Dropdown>
</template>
