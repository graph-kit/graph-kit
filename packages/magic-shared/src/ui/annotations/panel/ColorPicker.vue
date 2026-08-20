<script setup lang="ts">
  import colors from '@core/utils/colors';
  import { mdiPalette } from '@mdi/js';

  import HStack from '../../../components/layout/HStack.vue';
  import ColorSwatchVue from './ColorSwatch.vue';
  import CustomColorSwatchVue from './CustomColorSwatch.vue';
  import PanelSection from './PanelSection.vue';
  import { ColorSwatch } from './types.ts';
  import { useDisabledWhileErasing } from './useDisabledWhileErasing.ts';

  const disabled = useDisabledWhileErasing();

  const swatchColors: ColorSwatch[] = [
    { name: 'Red', value: colors.RED_600 },
    { name: 'Blue', value: colors.BLUE_600 },
    { name: 'Green', value: colors.GREEN_600 },
    { name: 'Yellow', value: colors.YELLOW_600 },
  ];
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
        <ColorSwatchVue
          v-for="color of swatchColors"
          :key="color.value"
          :name="color.name"
          :hex="color.value"
        />
      </HStack>
      <CustomColorSwatchVue :swatches="swatchColors" />
    </HStack>
  </PanelSection>
</template>
