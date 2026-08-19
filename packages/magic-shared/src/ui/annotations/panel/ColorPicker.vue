<script setup lang="ts">
  import { COLORS } from '@core/annotations/index';
  import { mdiPalette } from '@mdi/js';

  import HStack from '../../../components/layout/HStack.vue';
  import ColorSwatch from './ColorSwatch.vue';
  import CustomColorSwatch from './CustomColorSwatch.vue';
  import PanelSection from './PanelSection.vue';
  import { useDisabledWhileErasing } from './useDisabledWhileErasing.ts';

  const disabled = useDisabledWhileErasing();
</script>

<template>
  <PanelSection
    label="Color"
    :icon="mdiPalette"
    :disabled="disabled"
  >
    <HStack
      :gap="2"
      class="px-1"
    >
      <HStack
        :gap="2"
        class="grow"
      >
        <ColorSwatch
          v-for="color of COLORS"
          :key="color"
          :color="color"
        />
      </HStack>
      <div class="h-8 w-px bg-black/15 dark:bg-white/20"></div>
      <CustomColorSwatch />
    </HStack>
  </PanelSection>
</template>
