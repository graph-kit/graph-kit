<script setup lang="ts">
  import HStack from '@magic/shared/HStack';
  import Node from '@magic/shared/Node';
  import VStack from '@magic/shared/VStack';
  import Well from '@magic/shared/Well';
  import { HighlightProps } from '@magic/shared/component-slot/types';
  import { useProvidedGraph } from '@magic/shared/product';
  import { useCurrentFrame } from '@magic/shared/simulation';

  import { computed } from 'vue';

  import { formatDistance } from '../distance.ts';
  import { SingleSourceFrame } from './frame.ts';

  const graph = useProvidedGraph();

  const currentFrame = useCurrentFrame<SingleSourceFrame>();

  /*
    rows follow the graph's own node order rather than the distances, so a row
    stays put for the whole run. sorting by distance would reshuffle the table
    on every improvement, which is the one moment the reader is looking at it
  */
  const rows = computed(() => {
    const distances = currentFrame.value?.distances;
    if (!distances) return [];
    return graph.nodes.value
      .filter((node) => node.id in distances)
      .map((node) => ({ id: node.id, distance: distances[node.id] }));
  });
</script>

<template>
  <Well v-if="rows.length > 0">
    <VStack class="gap-2">
      <span class="text-sm font-bold opacity-60">Distance</span>
      <VStack class="gap-2 max-h-[50vh] overflow-y-auto pr-1">
        <HStack
          v-for="row in rows"
          :key="row.id"
          class="gap-3 justify-between"
        >
          <Node
            :id="row.id"
            :scale="0.6"
          />
          <span class="font-bold tabular-nums">
            {{ formatDistance(row.distance) }}
          </span>
        </HStack>
      </VStack>
    </VStack>
  </Well>
</template>
