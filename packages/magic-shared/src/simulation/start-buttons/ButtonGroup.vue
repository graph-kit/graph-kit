<script setup lang="ts">
  import { useMounted } from '@vueuse/core';

  import { computed } from 'vue';

  import OverflowRow from '../../components/layout/OverflowRow.vue';
  import Well from '../../components/layout/Well.vue';
  import { useProvidedShell } from '../../product/context.ts';
  import StartButton from './StartButton.vue';

  const shell = useProvidedShell();

  const isMounted = useMounted();

  const buttons = computed(() =>
    (shell.simulationButtons ?? []).map((button, index) => ({
      ...button,
      index,
    })),
  );

  const buttonKey = (button: { index: number }) => button.index;

  const show = computed(() => {
    const simRunning = shell.simulation.current.value;
    return isMounted.value && buttons.value.length > 0 && !simRunning;
  });
</script>

<template>
  <Well v-if="show">
    <OverflowRow
      :items="buttons"
      :key-of="buttonKey"
      label="More"
      class="max-w-[35vw]"
    >
      <template #default="{ item: button }">
        <component
          v-if="button.render"
          :is="button.render"
          :definition="button.definition"
          :disabled="button.disabled?.() ?? false"
          :before-starting="button.beforeStarting"
        />
        <StartButton
          v-else
          :definition="button.definition"
          :name="button.name"
          :disabled="button.disabled?.() ?? false"
          :before-starting="button.beforeStarting"
        />
      </template>
    </OverflowRow>
  </Well>
</template>
