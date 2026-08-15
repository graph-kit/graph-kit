<script setup lang="ts">
  import ToggleButtonGroupItem from '@core/components/ToggleButtonGroupItem';
</script>

<template>
  <ToggleButtonGroupItem
    class="hover:bg-gray-100 aria-pressed:bg-gray-900 aria-pressed:text-white dark:text-white dark:hover:bg-gray-700 dark:aria-pressed:bg-white dark:aria-pressed:text-gray-900"
  >
    <slot />
  </ToggleButtonGroupItem>
</template>
