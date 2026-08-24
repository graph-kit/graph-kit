<script setup lang="ts">
  import { computed } from 'vue';

  import HStack from '../../components/layout/HStack.vue';
  import Well from '../../components/layout/Well.vue';
  import { useProvidedShell } from '../../product/context.ts';
  import StartButton from './StartButton.vue';

  const shell = useProvidedShell();

  const buttons = computed(() => shell.simulationButtons ?? []);

  const show = computed(() => {
    const simRunning = shell.simulation.current.value;
    return buttons.value.length > 0 && !simRunning;
  });
</script>

<template>
  <Well v-if="show">
    <HStack class="flex-wrap">
      <template
        v-for="(
          {
            disabled = () => false as const,
            beforeStarting,
            definition,
            render,
          },
          index
        ) in buttons"
        :key="index"
      >
        <component
          v-if="render"
          :is="render"
          :definition="definition"
          :disabled="disabled()"
          :before-starting="beforeStarting"
        />
        <StartButton
          v-else
          :definition="definition"
          :disabled="disabled()"
          :before-starting="beforeStarting"
        />
      </template>
    </HStack>
  </Well>
</template>
