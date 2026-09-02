<script setup lang="ts">
  import VStack from '../../../components/layout/VStack.vue';
  import Well from '../../../components/layout/Well.vue';
  import DebugHeading from './DebugHeading.vue';
  import { PANEL } from './classes.ts';

  defineProps<{ title: string }>();
</script>

<template>
  <Well :class="PANEL">
    <VStack gap="3">
      <DebugHeading :title="title">
        <template #badge><slot name="badge" /></template>
      </DebugHeading>
      <slot />
    </VStack>
  </Well>
</template>
