<script setup lang="ts">
  import { getValue } from '@core/utils/maybeGetter/index';
  import { mdiInformationOutline } from '@mdi/js';

  import { computed } from 'vue';

  import Icon from '../../components/icon/Icon.vue';
  import ToggleButton from '../../components/toggle-button/ToggleButton.vue';
  import Tooltip from '../../components/tooltip/Tooltip.vue';
  import { LensChipDefinition, chipLabel, disabledState } from './types.ts';

  // otherwise attrs land on the ToggleButton and the tooltip content both, so
  // listeners meant for the chip also trigger from the tooltip.
  defineOptions({ inheritAttrs: false });

  const props = defineProps<LensChipDefinition>();

  const model = defineModel<boolean>();

  /** true while the user is pointing at or focused on the chip, its tooltip, or the gap between them */
  const active = defineModel<boolean>('active');

  const disabled = computed(() => disabledState(props));

  const label = computed(() => chipLabel(props));

  // a natively disabled button dispatches no pointer events, so the tooltip
  // carrying the reason would never open on the one chip that needs it
  const disabledClasses =
    'cursor-not-allowed opacity-50 hover:bg-gray-300 active:scale-100 dark:hover:bg-gray-900';
</script>

<template>
  <Tooltip
    v-model:open="active"
    :label="disabled?.reason ?? getValue(tooltipLabel)"
  >
    <template #trigger>
      <ToggleButton
        v-bind="$attrs"
        v-model="model"
        :aria-disabled="!!disabled"
        :class="['gap-2', disabled && disabledClasses]"
      >
        <span>
          {{ label }}
        </span>
        <Icon :path="mdiInformationOutline" />
      </ToggleButton>
    </template>
  </Tooltip>
</template>
