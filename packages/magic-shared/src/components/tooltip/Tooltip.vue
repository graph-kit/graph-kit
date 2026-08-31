<script setup lang="ts">
  import Tooltip from '@core/components/Tooltip';

  // https://github.com/graph-kit/graph-kit/issues/834
  // IMPORTANT: for consistency, had to remove these classes because components in core/components relying on tooltips such as icon buttons etc could not be styled in the magic/shared version
  // class="bg-gray-900 text-white dark:bg-gray-700"
</script>

<template>
  <Tooltip>
    <template #trigger><slot name="trigger" /></template>
    <slot />
  </Tooltip>
</template>
