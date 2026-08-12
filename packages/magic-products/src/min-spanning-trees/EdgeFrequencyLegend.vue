<script setup lang="ts">
  import HStack from '@magic/shared/HStack';
  import VStack from '@magic/shared/VStack';
  import Well from '@magic/shared/Well';
  import Tooltip from '@magic/shared/Tooltip';

  import { Explainer, ExplainerText } from '@magic/shared/explainer';
  import { useProvidedGraph } from '@magic/shared/product';

  import { computed } from 'vue';

  import { frequencyWidth, useEdgeFrequency } from './chips/edgeFrequency.ts';

  const graph = useProvidedGraph();

  const { totalMsts, frequencyOf, ratioOf } = useEdgeFrequency(graph);

  const rows = computed(() =>
    [...graph.edges.value]
      .sort((a, b) => frequencyOf(b.id) - frequencyOf(a.id))
      .map((edge) => ({
        id: edge.id,
        frequency: frequencyOf(edge.id),
        width: frequencyWidth(ratioOf(edge.id)),
        explainer: { content: `{${edge.id}}` } satisfies Explainer,
      })),
  );
</script>

<template>
  <Well v-if="totalMsts > 0">
    <VStack class="gap-2">
      <VStack class="gap-2 max-h-[50vh] overflow-y-auto pr-1">
        <HStack
          v-for="row in rows"
          :key="row.id"
          class="gap-3 justify-between"
        >
          <ExplainerText :explainer="row.explainer" />
          <Tooltip :label="`Appears in ${row.frequency} of ${totalMsts} minimum spanning trees.`">
            <template #trigger>
              <div class="font-bold tabular-nums">
                {{ row.frequency }}/{{ totalMsts }}
              </div>
            </template>
          </Tooltip>
        </HStack>
      </VStack>
    </VStack>
  </Well>
</template>
