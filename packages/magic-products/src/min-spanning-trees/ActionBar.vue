<script setup lang="ts">
  import Button from '@magic/shared/Button';
  import HStackVue from '@magic/shared/HStack';
  import Tooltip from '@magic/shared/Tooltip';
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
    <Tooltip
      :label="
        focusedNode
          ? 'Generates a minimum spanning tree'
          : 'Select a node to start'
      "
    >
      <template #trigger>
        <span class="inline-block">
          <Button
            @click="startPrims"
            class="text-lg"
            :disabled="!focusedNode"
          >
            Run Prim's
          </Button>
        </span>
      </template>
    </Tooltip>
    <Tooltip :label="kruskalsButtonLabel">
      <template #trigger>
        <Button
          @click="startKruskals"
          class="text-lg"
        >
          Run Kruskal's
        </Button>
      </template>
    </Tooltip>
  </HStackVue>
</template>
