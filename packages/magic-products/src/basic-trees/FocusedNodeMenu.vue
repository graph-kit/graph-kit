<script setup lang="ts">
  import Button from '@magic/shared/Button';
  import HStack from '@magic/shared/HStack';
  import Well from '@magic/shared/Well';
  import { useProvidedMagicGraph } from '@magic/shared/product';
  import { useFocusedNode } from '@magic/shared/utilities/useFocusedNode';

  import { useAVLSimulationDefinition } from './simulations/useAVLSimulation.ts';

  const graph = useProvidedMagicGraph();

  const avl = useAVLSimulationDefinition();

  const removeNodeFromAvl = (target: string) => {
    avl.controls.mode.value = 'remove';
    avl.controls.target.value = target;
    graph.magic.simulation.start(avl.definition);
  };

  const node = useFocusedNode(graph);
</script>

<template>
  <Well v-if="node && !graph.magic.simulation.current.value">
    <HStack>
      <Button @click="removeNodeFromAvl(node.id)">
        Remove {{ node.label }}
      </Button>
    </HStack>
  </Well>
</template>
