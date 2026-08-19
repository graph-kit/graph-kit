<script setup lang="ts">
  import { getRandomInRange } from '@core/utils/random';
  import Button from '@magic/shared/Button';
  import Icon from '@magic/shared/Icon';
  import { useProvidedGraph } from '@magic/shared/graph-product';
  import { useProvidedMagic } from '@magic/shared/product';
  import { mdiPlay } from '@mdi/js';

  import { useProvidedTreeSimulation } from './useProvidedTree.ts';

  const graph = useProvidedGraph();
  const magic = useProvidedMagic();
  const {
    controls: { mode, target },
    definition,
  } = useProvidedTreeSimulation();

  const insert = () => {
    mode.value = 'insert';
    const id = getRandomInRange(1, 100).toString();
    target.value = id;
    graph.actions.addNode({
      id,
      label: id,
      position: { x: 800, y: 250 },
    });
    magic.simulation.start(definition);
  };
</script>

<template>
  <Button @click="insert">
    <template #start>
      <Icon :path="mdiPlay" />
    </template>
    Insert Node
  </Button>
</template>
