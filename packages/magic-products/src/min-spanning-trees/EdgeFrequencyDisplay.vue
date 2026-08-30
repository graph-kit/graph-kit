<script setup lang="ts">
  import { ExplainerText } from '@magic/shared/explainer';
  import { useProvidedGraph } from '@magic/shared/graph-shell';

  import { computed, ref } from 'vue';

  import { useEdgeFrequency } from './chips/edgeFrequency.ts';

  const graph = useProvidedGraph();
  const isGraphConnected = computed(
    () => graph.characteristics.connected.value.isConnected,
  );

  const { totalMsts, frequencyOf } = useEdgeFrequency(graph);

  const edgeId = ref<string>();

  graph.surface.events.elements.subscribe(
    'onHoveredElementChange',
    (element) => {
      if (!element) return (edgeId.value = undefined);
      const isEdge = graph.isEdge(element.id);
      edgeId.value = isEdge ? element.id : undefined;
    },
  );

  const displayString = computed(() => {
    if (!edgeId.value) return;
    return `{${edgeId.value}} Is In ${frequencyOf(edgeId.value)}/${totalMsts.value} Of This Graphs Minimum Spanning
    ${isGraphConnected.value ? 'Trees' : 'Forests'}`;
  });
</script>

<template>
  <ExplainerText
    v-if="displayString"
    :explainer="{
      content: displayString,
    }"
  />
</template>
