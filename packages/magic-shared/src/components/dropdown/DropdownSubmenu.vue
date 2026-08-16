<script setup lang="ts">
  import DropdownSubmenu from '@core/components/DropdownSubmenu';
</script>

<template>
  <DropdownSubmenu
    class="bg-gray-300 border-gray-200 text-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
  >
    <template #trigger><slot name="trigger" /></template>
    <slot />
  </DropdownSubmenu>
</template>
