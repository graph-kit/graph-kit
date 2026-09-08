<script setup lang="ts">
  import Button from '@magic/shared/Button';
  import Dropdown from '@magic/shared/Dropdown';
  import Icon from '@magic/shared/Icon';
  import TextInput from '@magic/shared/TextInput';
  import Well from '@magic/shared/Well';
  import { useProvidedGraph } from '@magic/shared/graph-shell';
  import { useProvidedShell } from '@magic/shared/product';
  import { mdiPlus } from '@mdi/js';

  import { computed, onUnmounted, ref } from 'vue';

  import { centerCameraOnTree } from './centerCameraOnTree.ts';
  import { useProvidedTreeActions } from './useProvidedTree.ts';

  const graph = useProvidedGraph();
  const shell = useProvidedShell();
  const { insertNode } = useProvidedTreeActions();

  const rawInput = ref('');

  const input = computed(() => {
    const trimmed = rawInput.value.trim();
    if (trimmed.length === 0) return undefined;
    return Number(trimmed);
  });

  const inputValid = computed(() => Number.isInteger(input.value));

  const showError = computed(
    () => input.value !== undefined && !inputValid.value,
  );

  const insert = () => {
    const value = input.value;
    if (value === undefined || !inputValid.value) return;

    const isRootNode = graph.nodes.value.length === 0;
    if (isRootNode) centerCameraOnTree(shell.surface);

    insertNode(value);
    rawInput.value = '';
  };

  const open = ref(false);

  const openOnDblClick = () => (open.value = true);

  shell.surface.events.canvas.subscribe('onDblClick', openOnDblClick);

  onUnmounted(() =>
    shell.surface.events.canvas.unsubscribe('onDblClick', openOnDblClick),
  );
</script>

<template>
  <Dropdown v-model:open="open">
    <template #trigger>
      <Button>
        <template #start>
          <Icon :path="mdiPlus" />
        </template>
        Insert Node
      </Button>
    </template>
    <Well class="w-48">
      <TextInput
        v-model="rawInput"
        :invalid="showError"
        @keyup.enter="insert"
        @vue:mounted="({ el }) => el?.focus()"
        inputmode="numeric"
        placeholder="Enter an integer"
      />
      <Button
        @click="insert"
        :disabled="inputValid ? false : 'Enter an integer'"
        class="w-full mt-2"
      >
        <template #start>
          <Icon :path="mdiPlus" />
        </template>
        Insert
      </Button>
    </Well>
  </Dropdown>
</template>
