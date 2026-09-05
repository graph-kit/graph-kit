<script setup lang="ts">
  import Well from '@magic/shared/Well';
  import { Explainer, ExplainerText } from '@magic/shared/explainer';
  import { useProvidedGraph } from '@magic/shared/graph-shell';

  import { computed } from 'vue';

  const graph = useProvidedGraph();

  const mst = computed(() => graph.minimumSpanningTrees.one.value);

  const mstCostExplainer = computed<Explainer | undefined>(() => {
    const stringOfPluses = mst.value.edges
      .map((edgeId) => `{${edgeId}} + `)
      .join('')
      .slice(0, -2);
    return {
      content: `${stringOfPluses} = <${mst.value.cost}>`,
    };
  });
</script>

<template>
  <Well v-if="graph.edges.value.length > 0">
    <ExplainerText :explainer="mstCostExplainer" />
  </Well>
</template>
