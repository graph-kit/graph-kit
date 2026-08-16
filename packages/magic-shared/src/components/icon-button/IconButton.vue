<script setup lang="ts">
  import IconButton from '@core/components/IconButton';

  // declared rather than left to fall through, so a call site that disables a button
  // without saying why is a type error instead of a silent boolean
  interface Props {
    disabled?: boolean | string;
  }

  defineProps<Props>();
</script>

<template>
  <IconButton
    class="bg-gray-300 text-gray-900 hover:bg-gray-100 active:bg-gray-100 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-700 dark:active:bg-gray-700"
    :disabled="disabled"
  />
</template>
