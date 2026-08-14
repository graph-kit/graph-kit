<script setup lang="ts">
  import Well from '@magic/shared/Well';
  import { useProvidedGraph } from '@magic/shared/graph-product';

  import { computed, ref } from 'vue';

  import { useEdgeFrequency } from './chips/edgeFrequency.ts';

  const graph = useProvidedGraph();

  const { totalMsts, frequencyOf } = useEdgeFrequency(graph);

  const edgeId = ref();

  graph.canvas.events.subscribe('onHoveredElementChange', (element) => {
    if (!element) return (edgeId.value = undefined);
    const isEdge = graph.isEdge(element.id);
    edgeId.value = isEdge ? element.id : undefined;
  });

  const displayString = computed(
    () => `In ${frequencyOf(edgeId.value)} of ${totalMsts.value} Minimum Spanning
    Trees`,
  );
</script>

<template>
  <Well v-if="edgeId">{{ displayString }}</Well>
</template>
