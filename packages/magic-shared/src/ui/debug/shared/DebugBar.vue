<script setup lang="ts">
  import { computed } from 'vue';

  import HStack from '../../../components/layout/HStack.vue';
  import { LABEL, VALUE } from './classes.ts';

  const props = defineProps<{
    label: string;
    value: number;
    /** the value that fills the bar, normally the largest in the run */
    max: number;
  }>();

  const width = computed(() => `${(props.value / (props.max || 1)) * 100}%`);
</script>

<template>
  <HStack gap="2">
    <span :class="[LABEL, 'w-14 shrink-0 truncate']">{{ label }}</span>
    <div class="h-1 flex-1 rounded-full bg-gray-300 dark:bg-gray-700">
      <div
        class="h-full rounded-full bg-gray-500 dark:bg-gray-400"
        :style="{ width }"
      ></div>
    </div>
    <span :class="[VALUE, 'w-8 shrink-0 text-right']">{{ value }}</span>
  </HStack>
</template>
