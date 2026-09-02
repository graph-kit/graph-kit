<script setup lang="ts">
  import { nullThrows } from '@core/utils/assert';
  import { useMounted } from '@vueuse/core';

  import { computed, onUnmounted, ref, watch } from 'vue';

  import OverflowRow from '../../components/layout/OverflowRow.vue';
  import Well from '../../components/layout/Well.vue';
  import { useProvidedShell } from '../../product/context.ts';
  import LensChip from './LensChip.vue';
  import { LensChipDefinition, disabledReason } from './types.ts';

  const chipId = (chip: LensChipDefinition) => chip.lens.id;

  // the chips keep their shape on the menu, which only needs the light half lifted off
  // the panel it shares a colour with. dark already separates them
  const menuChipClasses = 'bg-gray-200 dark:bg-gray-900';

  const shell = useProvidedShell();

  const isMounted = useMounted();

  const pinnedLensId = ref<string>();
  const hoveredLensId = ref<string>();
  const hoverSuppressedLensId = ref<string>();

  const chips = computed(() =>
    nullThrows(
      shell.lensChips,
      'LensChipGroup is being rendered without chips!',
    ),
  );

  const sortedChips = computed(() => [
    ...chips.value.filter((chip) => !disabledReason(chip)),
    ...chips.value.filter((chip) => disabledReason(chip)),
  ]);

  const togglePinnedLens = (chip: LensChipDefinition) => {
    if (disabledReason(chip)) return;
    const lensId = chipId(chip);
    const wasPinned = lensId === pinnedLensId.value;
    pinnedLensId.value = wasPinned ? undefined : lensId;
    // unpinning has to read as off right away, so the hover the click came with
    // is ignored until the cursor leaves the chip
    hoverSuppressedLensId.value = wasPinned ? lensId : undefined;
  };

  const setHovered = (chip: LensChipDefinition, hovered: boolean) => {
    const lensId = chipId(chip);
    if (hovered) {
      if (disabledReason(chip)) return;
      hoveredLensId.value = lensId;
      return;
    }
    if (hoveredLensId.value !== lensId) return;
    hoveredLensId.value = undefined;
    hoverSuppressedLensId.value = undefined;
  };

  const clearActiveChip = () => {
    pinnedLensId.value = undefined;
    hoveredLensId.value = undefined;
    hoverSuppressedLensId.value = undefined;
  };

  shell.simulation.events.subscribe('onSimulationStarted', clearActiveChip);
  onUnmounted(() =>
    shell.simulation.events.unsubscribe('onSimulationStarted', clearActiveChip),
  );

  const disabledLensIds = computed(
    () => new Set(chips.value.filter(disabledReason).map(chipId)),
  );

  // if chip goes disabled while active, drop its lens
  // so it doesn't spring back up when it becomes re-enabled
  watch(disabledLensIds, (disabledIds) => {
    if (pinnedLensId.value && disabledIds.has(pinnedLensId.value)) {
      pinnedLensId.value = undefined;
    }
    if (hoveredLensId.value && disabledIds.has(hoveredLensId.value)) {
      hoveredLensId.value = undefined;
      hoverSuppressedLensId.value = undefined;
    }
  });

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
  <Well v-if="isMounted && chips.length > 0">
    <OverflowRow
      :items="sortedChips"
      :key-of="chipId"
      label="More"
      class="max-w-[calc(50vw-2rem)]"
    >
      <template #default="{ item: chip, inMenu }">
        <LensChip
          v-bind="chip"
          @click="togglePinnedLens(chip)"
          @focus="setHovered(chip, true)"
          @blur="setHovered(chip, false)"
          @update:active="setHovered(chip, $event ?? false)"
          :model-value="chipId(chip) === pinnedLensId"
          :class="inMenu ? menuChipClasses : undefined"
        />
      </template>
    </OverflowRow>
  </Well>
</template>
