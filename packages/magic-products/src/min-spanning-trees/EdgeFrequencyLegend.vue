<script setup lang="ts">
  import HStack from '@magic/shared/HStack';
  import VStack from '@magic/shared/VStack';
  import Well from '@magic/shared/Well';
  import { useProvidedGraph } from '@magic/shared/product';

  import { computed } from 'vue';

  import { frequencyColor } from './chips/edgeFrequency.ts';

  const graph = useProvidedGraph();

  const totalMsts = computed(() => {
    const result = graph.minimumSpanningTrees.all.value;
    return result.skipped ? 0 : result.msts.length;
  });

  const GRADIENT_STOPS = 8;
  const gradient = computed(() => {
    const stops = Array.from({ length: GRADIENT_STOPS }, (_, i) =>
      frequencyColor(i / (GRADIENT_STOPS - 1)),
    );
    return `linear-gradient(to right, ${stops.join(', ')})`;
  });
</script>

<template>
  <Well v-if="totalMsts > 0">
    <VStack class="gap-2">
      <span class="text-sm font-bold opacity-60">Edge Frequency</span>
      <div
        class="h-3 w-40 rounded-full"
        :style="{ background: gradient }"
      />
      <HStack class="justify-between w-40">
        <span class="text-xs font-bold opacity-60">Least used</span>
        <span class="text-xs font-bold opacity-60">Most used</span>
      </HStack>
    </VStack>
  </Well>
</template>
