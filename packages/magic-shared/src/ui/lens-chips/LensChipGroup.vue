<script setup lang="ts">
  import { nullThrows } from '@core/utils/assert';
  import { useMounted } from '@vueuse/core';

  import { computed, onUnmounted, ref, watch } from 'vue';

  import OverflowRow from '../../components/layout/OverflowRow.vue';
  import Well from '../../components/layout/Well.vue';
  import { useProvidedShell } from '../../product/context.ts';
  import LensChip from './LensChip.vue';
  import { LensChipDefinition, disabledState, lensFor } from './types.ts';

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
    ...chips.value.filter((chip) => !disabledState(chip)),
    ...chips.value.filter((chip) => disabledState(chip)),
  ]);

  const togglePinnedLens = (chip: LensChipDefinition) => {
    if (disabledState(chip)) return;
    const lensId = chipId(chip);
    const wasPinned = lensId === pinnedLensId.value;
    pinnedLensId.value = wasPinned ? undefined : lensId;
    // unpinning has to read as off right away, so the hover the click came with
    // is ignored until the cursor leaves the chip
    hoverSuppressedLensId.value = wasPinned ? lensId : undefined;

    if (!wasPinned) shell.telemetry.track('lens-chip.pinned', { lensId });
  };

  const setHovered = (chip: LensChipDefinition, hovered: boolean) => {
    const lensId = chipId(chip);
    if (hovered) {
      if (!lensFor(chip)) return;
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
    () => new Set(chips.value.filter(disabledState).map(chipId)),
  );

  // if chip goes disabled while pinned, drop it
  // so it doesn't spring back up when it becomes re-enabled. hover ends on its
  // own, and until it does the lens resolves to whatever the disabled one offers
  watch(disabledLensIds, (disabledIds) => {
    if (pinnedLensId.value && disabledIds.has(pinnedLensId.value)) {
      pinnedLensId.value = undefined;
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

  const displayedLens = computed(() => {
    const chip = displayedChip.value;
    return chip && lensFor(chip);
  });

  // watching the resolved lens rather than the chip, so the lens taken off is
  // always the one that went on, even when the chip swapped which it offers
  watch(displayedLens, (newLens, oldLens) => {
    if (oldLens) {
      shell.lens.remove(oldLens.id);
    }
    if (newLens) {
      shell.lens.add(newLens);
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
