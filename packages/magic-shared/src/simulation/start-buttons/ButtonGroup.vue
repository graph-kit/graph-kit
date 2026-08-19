<script setup lang="ts">
  import { computed } from 'vue';

  import HStack from '../../components/layout/HStack.vue';
  import Well from '../../components/layout/Well.vue';
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
          { disabled = () => false as const, definition, render }, index
        ) in buttons"
        :key="index"
      >
        <component
          v-if="render"
          :is="render"
          :definition="definition"
          :disabled="disabled()"
        />
        <StartButton
          v-else
          :definition="definition"
          :disabled="disabled()"
        />
      </template>
    </HStack>
  </Well>
</template>
