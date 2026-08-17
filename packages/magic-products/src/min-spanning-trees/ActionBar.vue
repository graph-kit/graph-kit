<script setup lang="ts">
  import Button from '@magic/shared/Button';
  import HStackVue from '@magic/shared/HStack';
  import { useProvidedMagicGraph } from '@magic/shared/graph-product';
  import { useFocusedNode } from '@magic/shared/utilities';

  import { computed } from 'vue';

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
  const isGraphConnected = computed(
    () => graph.characteristics.connected.value.isConnected,
  );

  const kruskalsButtonLabel = computed(
    () =>
      `Generates a minimum spanning ${isGraphConnected.value ? 'tree' : 'forest'}`,
  );
</script>

<template>
  <HStackVue v-if="!graph.magic.simulation.current.value">
    <Button
      @click="startPrims"
      class="text-lg"
      :disabled="focusedNode ? undefined : 'Select a node to start'"
    >
      Run Prim's
    </Button>
    <Button
      @click="startKruskals"
      class="text-lg"
    >
      Run Kruskal's
    </Button>
  </HStackVue>
</template>
