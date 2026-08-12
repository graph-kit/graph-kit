<script setup lang="ts">
  import Button from '@magic/shared/Button';
  import HStackVue from '@magic/shared/HStack';
  import Tooltip from '@magic/shared/Tooltip';
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
    <Tooltip :label="focusedNode ? undefined : 'Select a node to start'">
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
    <Button
      @click="startKruskals"
      class="text-lg"
    >
      Run Kruskal's
    </Button>
  </HStackVue>
</template>
