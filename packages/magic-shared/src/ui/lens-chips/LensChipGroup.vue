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

  const chips = computed(() =>
    nullThrows(
      shell.lensChips,
      'LensChipGroup is being rendered without chips!',
    ),
  );

  const togglePinnedLens = (lensId: string) => {
    pinnedLensId.value = lensId === pinnedLensId.value ? undefined : lensId;
  };

  const displayedChipId = computed(
    () => hoveredLensId.value ?? pinnedLensId.value,
  );

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
          @focus="hoveredLensId = chipId(chip)"
          @blur="hoveredLensId = undefined"
          @update:active="
            $event
              ? (hoveredLensId = chipId(chip))
              : hoveredLensId === chipId(chip) && (hoveredLensId = undefined)
          "
          :model-value="chipId(chip) === pinnedLensId"
        />
      </template>
    </HStack>
  </Well>
</template>
