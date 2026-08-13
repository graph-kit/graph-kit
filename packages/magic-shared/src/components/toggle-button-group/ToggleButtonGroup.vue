<script setup lang="ts">
  import ToggleButtonGroup from '@core/components/ToggleButtonGroup';

  const selected = defineModel<string>();
</script>

<template>
  <ToggleButtonGroup
    v-model="selected"
    class="divide-gray-300 border-gray-300 dark:divide-gray-700 dark:border-gray-700"
  >
    <slot />
  </ToggleButtonGroup>
</template>
