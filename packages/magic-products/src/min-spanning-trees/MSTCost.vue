<script setup lang="ts">
  import { nullThrows } from '@core/utils/assert';
  import { fractionIsInteger, fractionToDecimal } from '@core/utils/math';
  import WellVue from '@magic/shared/Well';
  import { Explainer, ExplainerText } from '@magic/shared/explainer';
  import { useProvidedGraph } from '@magic/shared/product';
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

  const themer = graph.theme.createThemer({
    canvas: {
      'edge.default.color': (edge) => {
        const inMst = mst.value.some((e) => e.id === edge.id);
        return inMst
          ? graph.focus.theme._resolveToken(
              'edge.focus.color',
              graph.getEdge(edge.id),
            )
          : undefined;
      },
    },
  });

  const mstCostExplainer = computed<Explainer>(() => {
    if (result.value.skipped) {
      return {
        content: `graph is too large to enumerate every minimum spanning tree`,
        highlights: [],
      };
    }

    const stringOfPluses = mst.value
      .map((edge) => `{${edge.id}} + `)
      .join('')
      .slice(0, -2);
    return {
      content: `${stringOfPluses} = [${cost.value.toFraction()}]`,
      highlights: [
        {
          tooltipLabel: () =>
            fractionIsInteger(cost.value)
              ? undefined
              : fractionToDecimal(cost.value),
          activate: () => themer.activate(),
          deactivate: () => themer.deactivate(),
        },
      ],
    };
  });
</script>

<template>
  <WellVue>
    <ExplainerText :explainer="mstCostExplainer" />
  </WellVue>
</template>
