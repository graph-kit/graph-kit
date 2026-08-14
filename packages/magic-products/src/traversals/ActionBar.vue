<script setup lang="ts">
  import { nullThrows } from '@core/utils/assert';
  import Button from '@magic/shared/Button';
  import HStackVue from '@magic/shared/HStack';
  import Well from '@magic/shared/Well';
  import { useProvidedMagicGraph } from '@magic/shared/graph-product';
  import { useFocusedNode } from '@magic/shared/utilities';

  import { useTraversalSimulations } from './simulations/index.ts';

  const graph = useProvidedMagicGraph();

  const simulations = useTraversalSimulations();

  const node = useFocusedNode(graph);

  const startSim = (type: 'bfs' | 'dfs') => {
    simulations.startNodeId.value = nullThrows(
      node.value?.id,
      'no node defined',
    );
    graph.magic.simulation.start(simulations[type]);
    graph.focus.clear();
  };
</script>

<template>
  <div v-if="!graph.magic.simulation.current.value">
    <HStackVue
      v-if="node"
      class="p-1"
    >
      <Button
        @click="startSim('bfs')"
        class="text-lg"
      >
        Breadth-First Search
      </Button>
      <Button
        @click="startSim('dfs')"
        class="text-lg"
      >
        Depth-First Search
      </Button>
    </HStackVue>
    <Well
      v-else
      class="font-bold text-xl"
    >
      Click a Node to Begin Traversal!
    </Well>
  </div>
</template>
