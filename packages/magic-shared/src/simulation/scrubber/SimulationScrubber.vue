<script setup lang="ts">
  import { cn } from '@core/components/cn';
  import { mdiChevronLeft, mdiChevronRight } from '@mdi/js';

  import { computed } from 'vue';

  import IconButton from '../../components/icon-button/IconButton.vue';
  import HStack from '../../components/layout/HStack.vue';
  import VStack from '../../components/layout/VStack.vue';
  import Well from '../../components/layout/Well.vue';
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

  // sims declared with frameAt never end, so there is no progress to show
  const isBounded = computed(() =>
    Number.isFinite(simulation.value.frameCount),
  );

  const percentageComplete = computed(() => {
    const lastPosition = simulation.value.frameCount - 1;
    if (lastPosition <= 0) return 100;
    return (simulation.value.playhead.position / lastPosition) * 100;
  });
</script>

<template>
  <VStack class="items-center gap-5">
    <div>
      <SimulationExplainerText />
    </div>

    <div
      v-if="isBounded"
      class="w-90 h-4"
    >
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
          :disabled="simulation.playhead.isFirst()"
          @click="simulation.playhead.prev()"
          label=""
          aria-label="Previous"
        />
      </Well>
      <Well :class="wellClass">
        <IconButton
          :size="size"
          :class="iconButtonClasses"
          :disabled="simulation.playhead.isLast()"
          @click="simulation.playhead.next()"
          :path="mdiChevronRight"
          label=""
          aria-label="Next"
        />
      </Well>
    </HStack>
  </VStack>
</template>
