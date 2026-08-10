<script setup lang="ts">
  import { nullThrows } from '@core/utils/assert';
  import Button from '@magic/shared/Button';
  import HStack from '@magic/shared/HStack';
  import VStack from '@magic/shared/VStack';
  import Well from '@magic/shared/Well';
  import { useProvidedMagicGraph } from '@magic/shared/product';
  import { useFocusedNode } from '@magic/shared/utilities';

  import { usePathFindingSimulations } from './simulations/index.ts';

  const graph = useProvidedMagicGraph();

  const simulations = usePathFindingSimulations();

  const node = useFocusedNode(graph);

  const startFromFocusedNode = (type: 'dijkstras' | 'bellmanFord') => {
    simulations.sourceNodeId.value = nullThrows(
      node.value?.id,
      'no node defined',
    );
    graph.magic.simulation.start(simulations[type]);
    graph.focus.clear();
  };

  const startFloydWarshall = () => {
    graph.magic.simulation.start(simulations.floydWarshall);
    graph.focus.clear();
  };
</script>

<template>
  <VStack
    v-if="!graph.magic.simulation.current.value"
    class="p-1 items-center"
  >
    <HStack v-if="node">
      <Button
        @click="startFromFocusedNode('dijkstras')"
        class="text-lg"
      >
        Dijkstra's
      </Button>
      <Button
        @click="startFromFocusedNode('bellmanFord')"
        class="text-lg"
      >
        Bellman-Ford
      </Button>
    </HStack>
    <Well
      v-else
      class="font-bold text-xl"
    >
      Click a Node to Measure Distances From!
    </Well>
    <!--
      floyd warshall measures every pair at once, so it is the one algorithm
      here that has nothing to ask the user for
    -->
    <Button
      @click="startFloydWarshall"
      class="text-lg"
    >
      Floyd-Warshall
    </Button>
  </VStack>
</template>
