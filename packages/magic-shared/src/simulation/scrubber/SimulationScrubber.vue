<script setup lang="ts">
  import { cn } from '@core/components/cn';
  import { mdiChevronLeft, mdiChevronRight } from '@mdi/js';

  import { computed } from 'vue';

  import IconButton from '../../components/icon-button/IconButton.vue';
  import HStack from '../../components/layout/HStack.vue';
  import VStack from '../../components/layout/VStack.vue';
  import Well from '../../components/layout/Well.vue';
  import { useProvidedShell } from '../../product/context.ts';
  import { useRunningSimulation } from '../useRunningSimulation.ts';
  import SimulationExplainerText from './SimulationExplainerText.vue';

  const { simulation, violation } = useRunningSimulation();

  const VIOLATION_CLASSES =
    'bg-red-400 border-red-400 dark:bg-red-900 dark:border-red-900';

  const violationClasses = computed(() =>
    violation.value ? VIOLATION_CLASSES : '',
  );

  const baseWellClasses = 'p-0 rounded-full';

  const wellClass = computed(() => cn(violationClasses.value, baseWellClasses));
  const size = 48;

  const iconButtonClasses =
    'bg-transparent dark:bg-transparent px-8 rounded-full';

  const percentageComplete = computed(() => {
    const totalFrames = simulation.value.frames.length;
    const playhead = simulation.value.playhead.position;
    return (playhead / (totalFrames - 1)) * 100;
  });

  const shell = useProvidedShell();
  const { useShortcut } = shell.shortcuts;

  useShortcut({
    key: 'left',
    callback: () => {
      if (violation.value) return;
      if (!simulation.value.playhead.isFirst())
        simulation.value.playhead.prev();
    },
  });

  useShortcut({
    key: 'right',
    callback: () => {
      if (violation.value) return;
      if (!simulation.value.playhead.isLast()) simulation.value.playhead.next();
    },
  });

  const forwardButtonDisabled = computed(() => {
    return simulation.value.playhead.isLast() || violation.value !== undefined;
  });

  const backwardButtonDisabled = computed(() => {
    return simulation.value.playhead.isFirst() || violation.value !== undefined;
  });
</script>

<template>
  <VStack class="items-center gap-5">
    <div>
      <SimulationExplainerText />
    </div>

    <div class="w-90 h-4">
      <div class="absolute rounded-full">
        <div
          :class="
            cn(
              'absolute w-90 h-4 border-2 rounded-full border-gray-800 overflow-hidden',
              violationClasses,
            )
          "
        >
          <div
            :class="cn('h-4 bg-gray-800', violationClasses)"
            :style="{ width: `${percentageComplete}%` }"
          ></div>
        </div>
      </div>
    </div>

    <HStack>
      <Well :class="wellClass">
        <IconButton
          :path="mdiChevronLeft"
          :size="size"
          :class="iconButtonClasses"
          :disabled="backwardButtonDisabled"
          @click="simulation.playhead.prev()"
          label=""
          aria-label="Previous"
        />
      </Well>
      <Well :class="wellClass">
        <IconButton
          :size="size"
          :class="iconButtonClasses"
          :disabled="forwardButtonDisabled"
          @click="simulation.playhead.next()"
          :path="mdiChevronRight"
          label=""
          aria-label="Next"
        />
      </Well>
    </HStack>
  </VStack>
</template>
