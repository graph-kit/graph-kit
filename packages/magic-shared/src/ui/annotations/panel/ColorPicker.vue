<script setup lang="ts">
  import { mdiPalette } from '@mdi/js';

  import HStack from '../../../components/layout/HStack.vue';
  import ColorSwatch from '../panel-shared/ColorSwatch.vue';
  import CustomColorSwatch from '../panel-shared/CustomColorSwatch.vue';
  import { SWATCH_COLORS } from '../panel-shared/options.ts';
  import { useDisabledWhileErasing } from '../panel-shared/useDisabledWhileErasing.ts';
  import PanelSection from './PanelSection.vue';

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
          v-for="color of SWATCH_COLORS"
          :key="color.value"
          :name="color.name"
          :hex="color.value"
        />
      </HStack>
      <CustomColorSwatch />
    </HStack>
  </PanelSection>
</template>
