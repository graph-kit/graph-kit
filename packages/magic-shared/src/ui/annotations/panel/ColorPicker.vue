<script setup lang="ts">
  import colors from '@core/utils/colors';
  import { mdiPalette } from '@mdi/js';

  import HStack from '../../../components/layout/HStack.vue';
  import ColorSwatch from './ColorSwatch.vue';
  import CustomColorSwatch from './CustomColorSwatch.vue';
  import PanelSection from './PanelSection.vue';
  import { useDisabledWhileErasing } from './useDisabledWhileErasing.ts';

  const disabled = useDisabledWhileErasing();

  const swatchColors = [
    { name: 'Red', hex: colors.RED_600 },
    { name: 'Blue', hex: colors.BLUE_600 },
    { name: 'Green', hex: colors.GREEN_600 },
    { name: 'Yellow', hex: colors.YELLOW_600 },
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
        <ColorSwatch
          v-for="color of swatchColors"
          :key="color.hex"
          :name="color.name"
          :hex="color.hex"
        />
      </HStack>
      <CustomColorSwatch :default-hexes="swatchColors.map((c) => c.hex)" />
    </HStack>
  </PanelSection>
</template>
