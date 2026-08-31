<script setup lang="ts">
  import Button from '@magic/shared/Button';
  import Icon from '@magic/shared/Icon';
  import { useProvidedGraph } from '@magic/shared/graph-shell';
  import { mdiRestart } from '@mdi/js';

  import { graphToTree } from './graph-conversion/graphToTree.ts';
  import { useProvidedTree } from './useProvidedTree.ts';

  const graph = useProvidedGraph();
  const tree = useProvidedTree();

  const reset = () => {
    graph.actions.removeElements({ nodes: graph.nodes.value, edges: [] });
    tree.root = graphToTree(graph);
  };
</script>

<template>
  <Button
    @click="reset"
    class="hover:bg-red-500 hover:dark:bg-red-500 active:dark:bg-red-600 active:bg-red-600"
  >
    <template #start>
      <Icon :path="mdiRestart" />
    </template>
    Reset Tree
  </Button>
</template>
