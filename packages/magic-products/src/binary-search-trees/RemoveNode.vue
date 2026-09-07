<script setup lang="ts">
  import { assert } from '@core/utils/assert';
  import DisabledLensButton from '@magic/shared/DisabledLensButton';
  import Icon from '@magic/shared/Icon';
  import { useProvidedGraph } from '@magic/shared/graph-shell';
  import { useFocusedNode } from '@magic/shared/utilities/useFocusedNode';
  import { mdiPlay } from '@mdi/js';

  import { useProvidedTreeActions } from './useProvidedTree.ts';

  const graph = useProvidedGraph();
  const { removeNode } = useProvidedTreeActions();
  const node = useFocusedNode(graph);

  const remove = () => {
    assert(node.value, 'target not defined');
    removeNode(node.value.id);
  };
</script>

<template>
  <DisabledLensButton @click="remove">
    <template #start>
      <Icon :path="mdiPlay" />
    </template>
    Remove {{ node?.label ?? 'Node' }}
  </DisabledLensButton>
</template>
