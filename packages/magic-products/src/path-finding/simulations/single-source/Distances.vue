<script setup lang="ts">
  import HStack from '@magic/shared/HStack';
  import Node from '@magic/shared/Node';
  import VStack from '@magic/shared/VStack';
  import Well from '@magic/shared/Well';
  import { useProvidedGraph } from '@magic/shared/graph-shell';
  import { useCurrentFrame } from '@magic/shared/simulation';

  import { computed } from 'vue';

  import { Distance, formatDistance } from '../distance.ts';
  import { SingleSourceFrame } from './frame.ts';

  const graph = useProvidedGraph();

  const currentFrame = useCurrentFrame<SingleSourceFrame>();

  const byDistance = (left: Distance, right: Distance) => {
    if (left === undefined) return right === undefined ? 0 : 1;
    if (right === undefined) return -1;
    return left.compare(right);
  };

  const rows = computed(() => {
    const distances = currentFrame.value?.distances;
    if (!distances) return [];
    return graph.nodes.value
      .filter((node) => node.id in distances)
      .map((node) => ({ id: node.id, distance: distances[node.id] }))
      .sort((a, b) => byDistance(a.distance, b.distance));
  });
</script>

<template>
  <Well v-if="rows.length > 0">
    <VStack class="gap-2">
      <span class="text-lg font-bold">Distance</span>
      <VStack class="gap-2 max-h-[50vh] overflow-y-auto pr-1">
        <HStack
          v-for="row in rows"
          :key="row.id"
          class="gap-3 justify-between"
        >
          <Node
            :id="row.id"
            :scale="0.8"
          />
          <span class="font-bold tabular-nums">
            {{ formatDistance(row.distance) }}
          </span>
        </HStack>
      </VStack>
    </VStack>
  </Well>
</template>
