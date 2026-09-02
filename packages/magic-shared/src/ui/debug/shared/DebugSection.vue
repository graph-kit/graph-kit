<script setup lang="ts">
  import VStack from '../../../components/layout/VStack.vue';
  import { SECTION } from './classes.ts';

  /** untitled groups rows without heading them, for a panel that reports only one thing */
  defineProps<{ title?: string }>();
</script>

<template>
  <VStack gap="1">
    <span
      v-if="title"
      :class="SECTION"
    >
      {{ title }}
    </span>
    <slot />
  </VStack>
</template>
