<script setup lang="ts">
  import { nullThrows } from '@core/utils/assert';
  import Well from '@magic/shared/Well';
  import {
    Explainer,
    ExplainerText,
    fractionDecimalHint,
  } from '@magic/shared/explainer';
  import { useProvidedGraph } from '@magic/shared/graph-product';
  import Fraction from 'fraction.js';

  import { computed } from 'vue';

  const graph = useProvidedGraph();
  const result = computed(() => graph.minimumSpanningTrees.all.value);

  // over the plugin's maxNodes nothing is enumerated, so there is no cost to show
  const mst = computed(() =>
    result.value.skipped
      ? []
      : nullThrows(result.value.msts.at(0), 'no mst in graph!'),
  );

  const cost = computed(() =>
    result.value.skipped ? new Fraction(0) : result.value.totalWeight,
  );

  const mstCostExplainer = computed<Explainer | undefined>(() => {
    if (result.value.skipped) return;

    const stringOfPluses = mst.value
      .map((edge) => `{${edge.id}} + `)
      .join('')
      .slice(0, -2);
    return {
      content: `${stringOfPluses} = <${cost.value}>`,
      highlights: [
        {
          tooltipLabel: () => fractionDecimalHint(cost.value),
        },
      ],
    };
  });
</script>

<template>
  <Well v-if="graph.edges.value.length > 0">
    <ExplainerText :explainer="mstCostExplainer" />
  </Well>
</template>
