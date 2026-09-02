<script setup lang="ts">
  import HStack from '../../../components/layout/HStack.vue';
  import { TITLE } from './classes.ts';

  defineProps<{ title: string }>();
</script>

<template>
  <HStack class="justify-between">
    <span :class="TITLE">{{ title }}</span>
    <!-- the one reading worth seeing without reading the panel, like a frame rate -->
    <slot name="badge" />
  </HStack>
</template>
