<script setup lang="ts">
  import { useProvidedGraph } from '@magic/shared/product';
  import { useCurrentFrame } from '@magic/shared/simulation';

  import { computed } from 'vue';

  import { PrimsFrame } from '../frame.ts';
  import EdgeListPanel from './EdgeListPanel.vue';

  const graph = useProvidedGraph();
  const currentFrame = useCurrentFrame<PrimsFrame>();

  const unexplored = computed(() => {
    const frame = currentFrame.value;
    if (!frame) return [];

    const spokenFor = new Set([
      ...frame.treeEdgeIds,
      ...(frame.candidateEdges ?? []),
      ...frame.excludedEdgeIds,
    ]);

    return graph.edges.value
      .map((edge) => edge.id)
      .filter((id) => !spokenFor.has(id));
  });
</script>

<template>
  <EdgeListPanel
    title="Unexplored"
    :ids="unexplored"
  />
</template>
