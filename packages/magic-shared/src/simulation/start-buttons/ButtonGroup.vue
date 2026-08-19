<script setup lang="ts">
  import Well from '@magic/shared/Well';

  import { computed } from 'vue';

  import HStack from '../../components/layout/HStack.vue';
  import { useProvidedMagic } from '../../product/context.ts';
  import StartButton from './StartButton.vue';

  const magic = useProvidedMagic();

  const buttons = computed(() => magic.simulationButtons ?? []);

  const show = computed(() => {
    const simRunning = magic.simulation.current.value;
    return buttons.value.length > 0 && !simRunning;
  });
</script>

<template>
  <Well v-if="show">
    <HStack class="flex-wrap">
      <template
        v-for="(
          { disabled = () => false, definition, render = StartButton }, index
        ) in buttons"
        :key="index"
      >
        <component
          :is="render"
          :definition="definition"
          :disabled="disabled()"
        />
      </template>
    </HStack>
  </Well>
</template>
