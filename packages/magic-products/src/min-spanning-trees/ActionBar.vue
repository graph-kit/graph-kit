<script setup lang="ts">
  import Button from '@magic/shared/Button';
  import HStackVue from '@magic/shared/HStack';
  import { useProvidedMagicGraph } from '@magic/shared/product';
  import { useFocusedNode } from '@magic/shared/utilities';

  import {
    useKruskalsSimulation,
    usePrimsSimulation,
  } from './simulations/index.ts';

  const graph = useProvidedMagicGraph();

  const prims = usePrimsSimulation();
  const kruskals = useKruskalsSimulation();

  const focusedNode = useFocusedNode(graph);

  const startKruskals = () => {
    graph.magic.simulation.start(kruskals.kruskals);
    graph.focus.clear();
  };

  const startPrims = () => {
    if (!focusedNode.value) return;
    prims.startNodeId.value = focusedNode.value.id;
    graph.magic.simulation.start(prims.prims);
    graph.focus.clear();
  };
</script>

<template>
  <HStackVue v-if="!graph.magic.simulation.current.value">
    <Button
      @click="startPrims"
      class="text-lg"
      :disabled="!focusedNode"
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
</template>
