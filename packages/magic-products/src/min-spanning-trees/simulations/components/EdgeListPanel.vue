<script setup lang="ts">
  import Edge from '@magic/shared/Edge';
  import HStack from '@magic/shared/HStack';
  import Node from '@magic/shared/Node';
  import VStack from '@magic/shared/VStack';
  import Well from '@magic/shared/Well';
  import { useProvidedGraph } from '@magic/shared/graph-shell';
  import type { GEdge } from '@magic/shared/graph/types';

  import { computed } from 'vue';

  const props = defineProps<{
    title: string;
    edgeIds: readonly GEdge['id'][];
    highlightId?: GEdge['id'];
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

  const highlightClass = (edgeId: GEdge['id']) => {
    return (
      'justify-between rounded-md ' +
      (edgeId === props.highlightId
        ? 'bg-amber-500/15 ring-2 ring-amber-500 p-1'
        : 'm-1')
    );
  };
</script>

<template>
  <Well v-if="edges.length > 0">
    <VStack class="gap-2">
      <span class="font-bold text-lg text-center">{{ title }}</span>
      <VStack class="gap-2 max-h-[38vh] overflow-y-auto p-1">
        <HStack
          v-for="edge in edges"
          :key="edge.id"
          :class="highlightClass(edge.id)"
        >
          <Node
            :id="edge.source"
            :scale="0.75"
            class="z-1"
          />
          <Edge
            :id="edge.id"
            :width="24"
            class="-mx-4"
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
