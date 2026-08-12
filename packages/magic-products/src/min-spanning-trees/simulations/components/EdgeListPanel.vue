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
    selectedId?: string;
  }>();

  const graph = useProvidedGraph();

  const rows = computed(() =>
    props.ids
      .map((id) => graph.getEdge(id))
      .sort((a, b) => a.weight.compare(b.weight))
      .map((edge) => {
        const [source, target] = [edge.source, edge.target].sort((a, b) =>
          graph.getNode(a).label.localeCompare(graph.getNode(b).label),
        );

        return {
          id: edge.id,
          source,
          target,
          weight: edge.weight.toFraction(),
        };
      }),
  );
</script>

<template>
  <Well v-if="rows.length > 0">
    <VStack class="gap-2">
      <span class="font-bold">{{ title }} ({{ rows.length }})</span>
      <VStack class="gap-2 max-h-[38vh] overflow-y-auto px-1">
        <HStack
          v-for="row in rows"
          :key="row.id"
          class="gap-2 items-center justify-between rounded-md px-1 transition-colors"
          :class="
            row.id === selectedId ? 'bg-amber-500/15 ring-1 ring-amber-500' : ''
          "
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
