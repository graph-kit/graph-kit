<script setup lang="ts">
  import HStack from '../../../components/layout/HStack.vue';
  import { LABEL, VALUE } from './classes.ts';

  defineProps<{ label: string; isOn: boolean }>();
</script>

<template>
  <div class="flex items-center justify-between gap-3">
    <HStack gap="2">
      <span
        class="size-1.5 shrink-0 rounded-full"
        :class="isOn ? 'bg-green-500' : 'bg-gray-400 dark:bg-gray-600'"
      ></span>
      <span :class="isOn ? VALUE : LABEL">{{ label }}</span>
    </HStack>
    <span :class="isOn ? VALUE : LABEL">{{ isOn ? 'on' : 'off' }}</span>
  </div>
</template>
