<script setup lang="ts">
  import { LABEL, VALUE } from './classes.ts';

  defineProps<{
    label: string;
    /** holds the label to a fixed column, so a run of rows lines its values up */
    fixedLabel?: boolean;
    /** the whole value, for when the column is too narrow to show all of it */
    title?: string;
  }>();
</script>

<template>
  <div class="flex items-baseline justify-between gap-3">
    <span :class="[LABEL, fixedLabel && 'w-14 shrink-0 truncate']">
      {{ label }}
    </span>
    <span
      :class="[VALUE, 'min-w-0 flex-1 truncate text-right']"
      :title="title"
    >
      <slot />
    </span>
  </div>
</template>
