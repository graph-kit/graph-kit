<script setup lang="ts">
  import { nullThrows } from '@core/utils/assert';
  import Button from '@magic/shared/Button';
  import HStackVue from '@magic/shared/HStack';
  import Well from '@magic/shared/Well';
  import { useProvidedGraph } from '@magic/shared/product';
  import { useFocusedNode } from '@magic/shared/utilities';

  import { useKruskalsSimulation, usePrimsSimulation } from './simulations/index.ts';

  const graph = useProvidedGraph();

  const prims = usePrimsSimulation();
  const kruskals = useKruskalsSimulation();

  const node = useFocusedNode(graph);

  const startPrims = () => {
    prims.startNodeId.value = nullThrows(node.value?.id, 'no node defined');
    graph.magic.simulation.start(prims.prims);
    graph.focus.clear();
  };

  const startKruskals = () => {
    graph.magic.simulation.start(kruskals.kruskals);
    graph.focus.clear();
  };
</script>

<template>
  <div v-if="!graph.magic.simulation.current.value">
    <HStackVue
      class="p-1"
    >
      <Button
        @click="startPrims"
        class="text-lg"
      >
        Prim's
      </Button>
      <Button
        @click="startKruskals"
        class="text-lg"
      >
        Kruskal's
      </Button>
    </HStackVue>
  </div>
</template>
