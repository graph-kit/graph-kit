<script setup lang="ts">
  import { mdiCheck, mdiSpeedometer } from '@mdi/js';

  import { computed, ref } from 'vue';

  import DropdownSubmenu from '../../components/dropdown/DropdownSubmenu.vue';
  import MenuItem from '../../components/dropdown/MenuItem.vue';
  import Icon from '../../components/icon/Icon.vue';
  import VStack from '../../components/layout/VStack.vue';
  import Tooltip from '../../components/tooltip/Tooltip.vue';
  import { useProvidedShell } from '../../product/context.ts';
  import { toast } from '../toast/index.ts';
  import {
    ANIMATION_SPEEDS,
    ANIMATION_SPEED_DURATION_MS,
    ANIMATION_SPEED_ICON,
    AnimationSpeed,
    durationMsToString,
    writeAnimationSpeed,
  } from './speeds.ts';

  const shell = useProvidedShell();

  const { autoAnimate } = shell.surface.renderer;

  const durationMs = ref(autoAnimate.animationDuration);
  autoAnimate.events.subscribe(
    'onAnimationDurationChanged',
    (newDurationMs) => (durationMs.value = newDurationMs),
  );

  const selected = computed(() =>
    ANIMATION_SPEEDS.find(
      (speed) => ANIMATION_SPEED_DURATION_MS[speed] === durationMs.value,
    ),
  );

  const select = (speed: AnimationSpeed) => {
    autoAnimate.setAnimationDuration(ANIMATION_SPEED_DURATION_MS[speed]);
    writeAnimationSpeed(speed);

    toast.show({
      title: 'Animation Speed Saved',
      description: `Animations now play over ${durationMsToString(ANIMATION_SPEED_DURATION_MS[speed])}.`,
      severity: 'success',
      duration: 5000,
    });
  };
</script>

<template>
  <DropdownSubmenu side="left">
    <template #trigger>
      <Icon :path="mdiSpeedometer" />
      Animation Speed
    </template>
    <VStack gap="0">
      <Tooltip
        v-for="speed in ANIMATION_SPEEDS"
        :key="speed"
        :label="durationMsToString(ANIMATION_SPEED_DURATION_MS[speed])"
        side="left"
      >
        <template #trigger>
          <MenuItem
            @click="select(speed)"
            :icon="ANIMATION_SPEED_ICON[speed]"
            :aria-current="selected === speed"
          >
            {{ speed }}
            <template #end>
              <Icon
                v-if="selected === speed"
                class="ml-auto"
                :size="18"
                :path="mdiCheck"
              />
            </template>
          </MenuItem>
        </template>
      </Tooltip>
    </VStack>
  </DropdownSubmenu>
</template>
