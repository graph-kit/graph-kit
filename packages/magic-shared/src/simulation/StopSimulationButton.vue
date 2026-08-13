<script setup lang="ts">
  import { mdiStop } from '@mdi/js';

  import Button from '../components/button/Button.vue';
  import Icon from '../components/icon/Icon.vue';
  import { useProvidedMagic } from '../product/context.ts';

  const magic = useProvidedMagic();
  const { useShortcut } = magic.shortcuts;
  useShortcut({
    key: 'escape',
    callback: magic.simulation.stop,
  });
</script>

<template>
  <Button
    v-if="magic.simulation.current.value"
    @click="magic.simulation.stop()"
    class="bg-red-500 dark:bg-red-500 hover:bg-red-600 dark:hover:bg-red-600 text-white"
  >
    <template #start>
      <Icon :path="mdiStop" />
    </template>
    Stop Simulation
  </Button>
</template>
