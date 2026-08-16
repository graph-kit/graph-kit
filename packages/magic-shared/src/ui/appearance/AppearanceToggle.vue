<script setup lang="ts">
  import {
    mdiMonitor,
    mdiThemeLightDark,
    mdiWeatherNight,
    mdiWhiteBalanceSunny,
  } from '@mdi/js';
  import { type BasicColorSchema } from '@vueuse/core';

  import Icon from '../../components/icon/Icon.vue';
  import HStack from '../../components/layout/HStack.vue';
  import VStack from '../../components/layout/VStack.vue';
  import ToggleButtonGroup from '../../components/toggle-button-group/ToggleButtonGroup.vue';
  import ToggleButtonGroupItem from '../../components/toggle-button-group/ToggleButtonGroupItem.vue';
  import Tooltip from '../../components/tooltip/Tooltip.vue';
  import { useProvidedMagic } from '../../product/context.ts';
  import { appearances } from './appearances.ts';

  const appearanceToDisplayString: Record<BasicColorSchema, string> = {
    auto: 'System Preference',
    dark: 'Dark Mode',
    light: 'Light Mode',
  };

  const appearanceToIcon: Record<BasicColorSchema, string> = {
    light: mdiWhiteBalanceSunny,
    dark: mdiWeatherNight,
    auto: mdiMonitor,
  };

  const magic = useProvidedMagic();
</script>

<template>
  <VStack class="py-2">
    <!-- <HStack class="px-2 font-bold bg-transparent w-full justify-start">
      <Icon :path="mdiThemeLightDark" />
      Appearance
    </HStack> -->
    <div class="px-2">
      <ToggleButtonGroup v-model="magic.appearance.value">
        <template
          v-for="appearance in appearances"
          :key="appearance"
        >
          <Tooltip :label="appearanceToDisplayString[appearance]">
            <template #trigger>
              <ToggleButtonGroupItem :value="appearance">
                <Icon
                  :size="18"
                  :path="appearanceToIcon[appearance]"
                />
              </ToggleButtonGroupItem>
            </template>
          </Tooltip>
        </template>
      </ToggleButtonGroup>
    </div>
  </VStack>
</template>
