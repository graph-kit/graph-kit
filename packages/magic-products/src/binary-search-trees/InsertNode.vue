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

  const MAX_MAGNITUDE = 999;

  const graph = useProvidedGraph();
  const shell = useProvidedShell();
  const { insertNode } = useProvidedTreeActions();

  const rawInput = ref('');

  const input = computed(() => {
    const trimmed = rawInput.value.trim();
    if (trimmed.length === 0) return undefined;
    return Number(trimmed);
  });

  /** why what was typed cannot be inserted, if it cannot */
  const invalidReason = computed(() => {
    const value = input.value;
    if (value === undefined || !Number.isInteger(value)) {
      return 'Enter an integer';
    }
    if (Math.abs(value) > MAX_MAGNITUDE) return 'Woah there!';
  });

  const showError = computed(
    () => input.value !== undefined && invalidReason.value !== undefined,
  );

  const insert = () => {
    const value = input.value;
    if (value === undefined || invalidReason.value) return;

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
        :disabled="invalidReason ?? false"
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
