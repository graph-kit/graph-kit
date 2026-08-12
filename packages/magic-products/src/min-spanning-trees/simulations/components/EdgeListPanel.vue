<script setup lang="ts">
  import HStack from '@magic/shared/HStack';
  import Node from '@magic/shared/Node';
  import VStack from '@magic/shared/VStack';
  import Well from '@magic/shared/Well';
  import { useProvidedGraph } from '@magic/shared/product';

  import { computed } from 'vue';

  const props = defineProps<{
    title: string;
    ids: readonly string[];
  }>();

  const graph = useProvidedGraph();

  const rows = computed(() =>
    props.ids
      .map((id) => graph.getEdge(id))
      .sort((a, b) => a.weight.compare(b.weight))
      .map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        weight: edge.weight.toFraction(),
      })),
  );
</script>

<template>
  <Well v-if="rows.length > 0">
    <VStack class="gap-2">
      <span class="text-sm font-bold opacity-60"
        >{{ title }} ({{ rows.length }})</span
      >
      <VStack class="gap-2 max-h-[38vh] overflow-y-auto pr-1">
        <HStack
          v-for="row in rows"
          :key="row.id"
          class="gap-2 items-center justify-between"
        >
          <Node
            :id="row.source"
            :scale="0.5"
          />
          <span class="font-bold tabular-nums text-xs">{{ row.weight }}</span>
          <Node
            :id="row.target"
            :scale="0.5"
          />
        </HStack>
      </VStack>
    </VStack>
  </Well>
</template>
