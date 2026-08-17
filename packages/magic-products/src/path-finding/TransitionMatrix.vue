<script setup lang="ts">
  import { getTransitionMatrix } from '@graph/plugins/transition-matrix/index';
  import { useProvidedGraph } from '@magic/shared/graph-product';

  const graph = useProvidedGraph();
  // const matrix = getTransitionMatrix(graph);
</script>

<template>
  <div>{{ 'abc' }}</div>
</template>
