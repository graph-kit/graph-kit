<script setup lang="ts">
  import Well from '@magic/shared/Well';

  import { computed } from 'vue';

  import HStack from '../../components/layout/HStack.vue';
  import { useProvidedMagic } from '../../product/context.ts';
  import StartButton from './StartButton.vue';
  import { SimulationButtonDefinition } from './types.ts';

  const magic = useProvidedMagic();

  const buttons = computed(() => magic.simulationButtons ?? []);

  const show = computed(() => {
    const simRunning = magic.simulation.current.value;
    return buttons.value.length > 0 && !simRunning;
  });

  const startSim = (def: SimulationButtonDefinition['definition']) => {
    magic.simulation.start(def);
  };
</script>

<template>
  <Well v-if="show">
    <HStack class="flex-wrap">
      <StartButton
        v-for="{ disabled = () => false, definition } in buttons"
        @click="startSim(definition)"
        :key="definition.name"
        :disabled="disabled()"
        >{{ definition.name }}</StartButton
      >
    </HStack>
  </Well>
</template>
