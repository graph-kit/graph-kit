<script setup lang="ts">
  import { nullThrows } from '@core/utils/assert';
  import { getRandomInRange } from '@core/utils/random';
  import Button from '@magic/shared/Button';
  import Dropdown from '@magic/shared/Dropdown';
  import Icon from '@magic/shared/Icon';
  import TextInput from '@magic/shared/TextInput';
  import Well from '@magic/shared/Well';
  import { useProvidedGraph } from '@magic/shared/graph-product';
  import { useProvidedMagic } from '@magic/shared/product';
  import { mdiPlay, mdiPlus, mdiPlusBox } from '@mdi/js';

  import { computed, ref } from 'vue';

  import { useProvidedTreeSimulation } from './useProvidedTree.ts';

  const graph = useProvidedGraph();
  const magic = useProvidedMagic();
  const {
    controls: { mode, target },
    definition,
  } = useProvidedTreeSimulation();

  const rawInput = ref('');

  const input = computed({
    get: () => rawInput.value,
    set: (value) => {
      rawInput.value = value.replace(/[^0-9]/g, '');
    },
  });

  const insert = () => {
    if (input.value.length === 0) return;
    mode.value = 'insert';
    const node = nullThrows(
      graph.actions.addNode({
        label: input.value,
        position: { x: 800, y: 250 },
      }),
      'node transaction failed',
    );
    target.value = node.id;
    magic.simulation.start(definition);
  };
</script>

<template>
  <Dropdown>
    <template #trigger>
      <Button>
        <template #start>
          <Icon :path="mdiPlay" />
        </template>
        Insert Node
      </Button>
    </template>
    <Well class="w-48">
      <TextInput
        v-model="input"
        @keyup.enter="insert"
        @vue:mounted="({ el }) => el?.focus()"
        inputmode="numeric"
        placeholder="Enter a number"
      />
      <Button
        @click="insert"
        :disabled="input.length === 0"
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
