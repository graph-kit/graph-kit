<script setup lang="ts">
  import { assert } from '@core/utils/assert';
  import DisabledLensButton from '@magic/shared/DisabledLensButton';
  import Icon from '@magic/shared/Icon';
  import Tooltip from '@magic/shared/Tooltip';
  import { useProvidedGraph } from '@magic/shared/graph-shell';
  import { DisabledLens } from '@magic/shared/lens/types';
  import { useFocusedNode } from '@magic/shared/utilities/useFocusedNode';
  import { mdiMinus } from '@mdi/js';

  import { computed } from 'vue';

  import { definitions } from './definitions.ts';
  import { getNodeById } from './tree/getNodeById.ts';
  import {
    useProvidedTree,
    useProvidedTreeActions,
  } from './useProvidedTree.ts';

  // declared rather than left to fall through, since the tooltip is the root
  // element now and would otherwise swallow it
  defineProps<{ disabled: DisabledLens | false }>();

  const graph = useProvidedGraph();
  const tree = useProvidedTree();
  const { removeNode } = useProvidedTreeActions();
  const node = useFocusedNode(graph);

  /** what removing the focused node does to the tree, in the terms the simulation explains it */
  const consequence = computed(() => {
    const focused = node.value;
    if (!focused) return;

    const target = getNodeById(tree.root, focused.id);
    if (!target) return;

    const { left, right } = target;

    if (left && right) {
      let successor = right;
      while (successor.left) successor = successor.left;
      return definitions.replacement.bothChildren(target, successor);
    }

    if (left) return definitions.replacement.onlyLeftChild(target, left);
    if (right) return definitions.replacement.onlyRightChild(target, right);

    return definitions.replacement.noChildren(target);
  });

  const remove = () => {
    assert(node.value, 'target not defined');
    removeNode(node.value.id);
  };
</script>

<template>
  <Tooltip :label="consequence">
    <template #trigger>
      <DisabledLensButton
        @click="remove"
        :disabled="disabled"
      >
        <template #start>
          <Icon :path="mdiMinus" />
        </template>
        Remove {{ node?.label ?? 'Node' }}
      </DisabledLensButton>
    </template>
  </Tooltip>
</template>
