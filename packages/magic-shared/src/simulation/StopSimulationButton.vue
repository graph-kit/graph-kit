<script setup lang="ts">
  import { cn } from '@core/components/cn';
  import { mdiStop } from '@mdi/js';

  import { computed } from 'vue';

  import Button from '../components/button/Button.vue';
  import Icon from '../components/icon/Icon.vue';
  import { useProvidedShell } from '../product/context.ts';

  const shell = useProvidedShell();

  const { useShortcut } = shell.shortcuts;

  useShortcut({
    key: 'escape',
    callback: shell.simulation.stop,
  });

  const isOnLastFrame = computed(
    () => shell.simulation.current.value?.playhead.isLast() ?? false,
  );

  const buttonClass = computed(() =>
    cn(
      'bg-red-500 dark:bg-red-500 hover:bg-red-600 dark:hover:bg-red-600 dark:active:bg-red-600 active:bg-red-600 text-white',
      isOnLastFrame.value && 'animate-pulse hover:animate-none',
    ),
  );
</script>

<template>
  <Button
    v-if="shell.simulation.current.value"
    @click="shell.simulation.stop()"
    :class="buttonClass"
  >
    <template #start>
      <Icon :path="mdiStop" />
    </template>
    Stop Simulation
  </Button>
</template>
