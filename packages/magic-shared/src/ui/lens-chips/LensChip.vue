<script setup lang="ts">
  import { getValue } from '@core/utils/maybeGetter/index';
  import { mdiInformationOutline } from '@mdi/js';

  import Icon from '../../components/icon/Icon.vue';
  import ToggleButton from '../../components/toggle-button/ToggleButton.vue';
  import Tooltip from '../../components/tooltip/Tooltip.vue';
  import { LensChipDefinition } from './types.ts';

  // otherwise attrs land on the ToggleButton and the tooltip content both, so
  // listeners meant for the chip also trigger from the tooltip.
  defineOptions({ inheritAttrs: false });

  const props = defineProps<LensChipDefinition>();

  const model = defineModel<boolean>();

  /** true while the user is pointing at or focused on the chip, its tooltip, or the gap between them */
  const active = defineModel<boolean>('active');
</script>

<template>
  <Tooltip
    v-model:open="active"
    :label="getValue(tooltipLabel)"
  >
    <template #trigger>
      <ToggleButton
        v-bind="$attrs"
        v-model="model"
        class="gap-2"
      >
        <span>
          {{ getValue(name) }}
        </span>
        <Icon
          v-if="getValue(tooltipLabel)"
          :path="mdiInformationOutline"
        />
      </ToggleButton>
    </template>
  </Tooltip>
</template>
