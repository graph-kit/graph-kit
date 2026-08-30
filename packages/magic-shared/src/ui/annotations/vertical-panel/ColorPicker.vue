<script setup lang="ts">
  import Dropdown from '../../../components/dropdown/Dropdown.vue';
  import DropdownItem from '../../../components/dropdown/DropdownItem.vue';
  import HStack from '../../../components/layout/HStack.vue';
  import Well from '../../../components/layout/Well.vue';
  import ColorSwatch from '../panel-shared/ColorSwatch.vue';
  import CustomColorSwatch from '../panel-shared/CustomColorSwatch.vue';
  import { SWATCH_COLORS } from '../panel-shared/options.ts';
  import { useDisabledWhileErasing } from '../panel-shared/useDisabledWhileErasing.ts';
  import { useAnnotationControls } from '../useAnnotationControls.ts';
  import PanelSpot from './PanelSpot.vue';

  const controls = useAnnotationControls();

  const disabled = useDisabledWhileErasing();
</script>

<template>
  <Dropdown side="right">
    <template #trigger>
      <PanelSpot
        label="Color"
        :disabled="disabled"
      >
        <span
          class="size-9 rounded-xl"
          :style="{ backgroundColor: controls.color.value }"
        />
      </PanelSpot>
    </template>
    <Well>
      <HStack :gap="2">
        <DropdownItem
          v-for="color of SWATCH_COLORS"
          :key="color.value"
        >
          <ColorSwatch
            :name="color.name"
            :hex="color.value"
          />
        </DropdownItem>
        <CustomColorSwatch />
      </HStack>
    </Well>
  </Dropdown>
</template>
