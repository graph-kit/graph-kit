<script setup lang="ts">
  import { nullThrows } from '@core/utils/assert';

  import { computed, ref, watch } from 'vue';

  import HStack from '../../components/layout/HStack.vue';
  import Well from '../../components/layout/Well.vue';
  import { useProvidedShell } from '../../product/context.ts';
  import LensChip from './LensChip.vue';
  import { LensChipDefinition } from './types.ts';

  const chipId = (chip: LensChipDefinition) => chip.lens.id;

  const shell = useProvidedShell();

  const pinnedLensId = ref<string>();
  const hoveredLensId = ref<string>();
  const hoverSuppressedLensId = ref<string>();

  const chips = computed(() =>
    nullThrows(
      shell.lensChips,
      'LensChipGroup is being rendered without chips!',
    ),
  );

  const togglePinnedLens = (lensId: string) => {
    const wasPinned = lensId === pinnedLensId.value;
    pinnedLensId.value = wasPinned ? undefined : lensId;
    // unpinning has to read as off right away, so the hover the click came with
    // is ignored until the cursor leaves the chip
    hoverSuppressedLensId.value = wasPinned ? lensId : undefined;
  };

  const setHovered = (lensId: string, hovered: boolean) => {
    if (hovered) {
      hoveredLensId.value = lensId;
      return;
    }
    if (hoveredLensId.value !== lensId) return;
    hoveredLensId.value = undefined;
    hoverSuppressedLensId.value = undefined;
  };

  const displayedChipId = computed(() => {
    const hovered =
      hoveredLensId.value === hoverSuppressedLensId.value
        ? undefined
        : hoveredLensId.value;
    return hovered ?? pinnedLensId.value;
  });

  const displayedChip = computed(() => {
    if (!displayedChipId.value) return;
    return nullThrows(
      chips.value.find((c) => c.lens.id === displayedChipId.value),
      `no chip found for lens ID "${displayedChipId.value}"`,
    );
  });

  watch(displayedChip, (newChip, oldChip) => {
    if (oldChip) {
      shell.lens.remove(oldChip.lens.id);
    }
    if (newChip) {
      shell.lens.add(newChip.lens);
    }
  });
</script>

<template>
  <Well v-if="chips.length > 0">
    <HStack class="flex-wrap">
      <template v-for="chip of chips">
        <LensChip
          v-bind="chip"
          @click="togglePinnedLens(chipId(chip))"
          @focus="setHovered(chipId(chip), true)"
          @blur="setHovered(chipId(chip), false)"
          @update:active="setHovered(chipId(chip), $event ?? false)"
          :model-value="chipId(chip) === pinnedLensId"
        />
      </template>
    </HStack>
  </Well>
</template>
