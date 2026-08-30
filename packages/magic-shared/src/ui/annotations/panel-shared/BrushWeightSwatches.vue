<script setup lang="ts">
  import HStack from '../../../components/layout/HStack.vue';
  import BrushWeightSwatch from './BrushWeightSwatch.vue';
  import { BRUSH_WEIGHTS } from './options.ts';
</script>

<template>
  <!-- fixed squares rather than a stretched row, so the slack spreads between them -->
  <HStack
    :gap="1"
    class="justify-between"
  >
    <BrushWeightSwatch
      v-for="weight of BRUSH_WEIGHTS"
      :key="weight.value"
      :name="weight.name"
      :weight="weight.value"
    />
  </HStack>
</template>
