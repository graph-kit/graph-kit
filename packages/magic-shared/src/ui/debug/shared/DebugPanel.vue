<script setup lang="ts">
  import HStack from '../../../components/layout/HStack.vue';
  import VStack from '../../../components/layout/VStack.vue';
  import Well from '../../../components/layout/Well.vue';
  import { PANEL, TITLE } from './classes.ts';

  defineProps<{ title: string }>();
</script>

<template>
  <Well :class="PANEL">
    <VStack gap="3">
      <HStack class="justify-between">
        <span :class="TITLE">{{ title }}</span>
        <!-- the one reading worth seeing without reading the panel, like a frame rate -->
        <slot name="badge" />
      </HStack>
      <slot />
    </VStack>
  </Well>
</template>
