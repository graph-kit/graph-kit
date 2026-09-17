<script setup lang="ts">
  import Icon from '@magic/shared/Icon';
  import Tooltip from '@magic/shared/Tooltip';
  import { mdiAlertCircle } from '@mdi/js';

  defineProps<{
    errorReason?: string;
  }>();
</script>

<template>
  <Tooltip
    v-if="errorReason"
    :label="errorReason"
  >
    <template #trigger>
      <div
        class="absolute inset-y-0 right-0 flex items-center px-2 text-red-600 dark:text-red-500"
      >
        <Icon :path="mdiAlertCircle" />
      </div>
    </template>
  </Tooltip>
</template>
