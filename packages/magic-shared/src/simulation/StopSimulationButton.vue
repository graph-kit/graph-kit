<script setup lang="ts">
  import { mdiStop } from '@mdi/js';

  import Button from '../components/button/Button.vue';
  import Icon from '../components/icon/Icon.vue';
  import { useProvidedShell } from '../product/context.ts';

  const shell = useProvidedShell();

  const { useShortcut } = shell.shortcuts;
  useShortcut({
    key: 'escape',
    callback: shell.simulation.stop,
  });
</script>

<template>
  <Button
    v-if="shell.simulation.current.value"
    @click="shell.simulation.stop()"
    class="bg-red-500 dark:bg-red-500 hover:bg-red-600 dark:hover:bg-red-600 dark:active:bg-red-600 active:bg-red-600 text-white"
  >
    <template #start>
      <Icon :path="mdiStop" />
    </template>
    Stop Simulation
  </Button>
</template>
