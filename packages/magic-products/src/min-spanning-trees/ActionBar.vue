<script setup lang="ts">
  import Button from '@magic/shared/Button';
  import HStackVue from '@magic/shared/HStack';
  import Well from '@magic/shared/Well';
  import { useProvidedMagicGraph } from '@magic/shared/product';
  import { useFocusedNode } from '@magic/shared/utilities';

  import { ref, watch } from 'vue';

  import { useKruskalsSimulation, usePrimsSimulation } from './simulations/index.ts';

  const graph = useProvidedMagicGraph();

  const prims = usePrimsSimulation();
  const kruskals = useKruskalsSimulation();

  const node = useFocusedNode(graph);

  const awaitingPrimsStartNode = ref(false);

  const armPrims = () => {
    graph.focus.clear();
    awaitingPrimsStartNode.value = true;
  };

  const cancelPrims = () => {
    awaitingPrimsStartNode.value = false;
  };

  const startKruskals = () => {
    graph.magic.simulation.start(kruskals.kruskals);
    graph.focus.clear();
  };

  watch(node, (focusedNode) => {
    if (!awaitingPrimsStartNode.value || !focusedNode) return;
    prims.startNodeId.value = focusedNode.id;
    graph.magic.simulation.start(prims.prims);
    graph.focus.clear();
    awaitingPrimsStartNode.value = false;
  });
</script>

<template>
  <div v-if="!graph.magic.simulation.current.value">
    <HStackVue
      v-if="!awaitingPrimsStartNode"
      class="p-1"
    >
      <Button
        @click="armPrims"
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
    <HStackVue
      v-else
      class="p-1 items-center"
    >
      <Well class="font-bold text-xl">
        Click a Node to Start Prim's From!
      </Well>
      <Button
        @click="cancelPrims"
        class="text-lg"
      >
        Cancel
      </Button>
    </HStackVue>
  </div>
</template>
