<script setup lang="ts">
  import HStack from '@magic/shared/HStack';
  import Node from '@magic/shared/Node';
  import VStack from '@magic/shared/VStack';
  import Well from '@magic/shared/Well';
  import { useProvidedGraph } from '@magic/shared/graph-product';

  import { computed } from 'vue';

  import Edge from './Edge.vue';

  const props = defineProps<{
    title: string;
    edgeIds: readonly string[];
    highlightId?: string;
  }>();

  const graph = useProvidedGraph();

  const edges = computed(() =>
    props.edgeIds
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
        };
      }),
  );
</script>

<template>
  <Well v-if="edges.length > 0">
    <VStack class="gap-2">
      <span class="font-bold text-lg text-center">{{ title }}</span>
      <VStack class="gap-2 max-h-[38vh] overflow-y-auto p-1">
        <HStack
          v-for="edge in edges"
          :key="edge.id"
          class="justify-between rounded-md transition-colors"
          :class="
            edge.id === highlightId
              ? 'bg-amber-500/15 ring-2 ring-amber-500 p-1'
              : 'm-1'
          "
        >
          <Node
            :id="edge.source"
            :scale="0.75"
            class="z-1"
          />
          <Edge
            :id="edge.id"
            class="w-18 -mx-4"
          />
          <Node
            :id="edge.target"
            :scale="0.75"
            class="z-1"
          />
        </HStack>
      </VStack>
    </VStack>
  </Well>
</template>
