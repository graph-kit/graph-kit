<script setup lang="ts">
  import { assert } from '@core/utils/assert';
  import Button from '@magic/shared/Button';
  import Icon from '@magic/shared/Icon';
  import { useProvidedGraph } from '@magic/shared/graph-product';
  import { useProvidedShell } from '@magic/shared/product';
  import { useFocusedNode } from '@magic/shared/utilities/useFocusedNode';
  import { mdiPlay } from '@mdi/js';

  import { useProvidedTreeSimulation } from './useProvidedTree.ts';

  const graph = useProvidedGraph();
  const shell = useProvidedShell();

  const {
    controls: { mode, target },
    definition,
  } = useProvidedTreeSimulation();
  const node = useFocusedNode(graph);

  const remove = () => {
    assert(node.value, 'target not defined');
    mode.value = 'remove';
    target.value = node.value.id;
    shell.simulation.start(definition);
  };
</script>

<template>
  <Button @click="remove">
    <template #start>
      <Icon :path="mdiPlay" />
    </template>
    Remove {{ node?.label ?? 'Node' }}
  </Button>
</template>
