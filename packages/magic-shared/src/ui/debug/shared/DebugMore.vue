<script setup lang="ts">
  import { LABEL } from './classes.ts';

  /** what a capped list left out. draws nothing when it left out nothing */
  defineProps<{ count: number }>();
</script>

<template>
  <span
    v-if="count > 0"
    :class="LABEL"
  >
    +{{ count }} more
  </span>
</template>
