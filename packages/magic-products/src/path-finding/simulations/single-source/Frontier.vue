<script setup lang="ts">
  import NodeList from '@magic/shared/NodeList';
  import { useProvidedGraph } from '@magic/shared/graph-shell';
  import { useCurrentFrame } from '@magic/shared/simulation';

  import { computed } from 'vue';

  import { SingleSourceFrame } from './frame.ts';

  const graph = useProvidedGraph();

  const currentFrame = useCurrentFrame<SingleSourceFrame>();

  const frontier = computed(() => currentFrame.value?.pendingNodeIds ?? []);
  const labelOf = (id: string) => graph.getNode(id).label;
</script>

<template>
  <NodeList
    :ids="frontier"
    :text-of="labelOf"
  />
</template>
