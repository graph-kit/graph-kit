<script setup lang="ts">
  import type { TooltipOptions } from '@core/components/Tooltip/types';
  import { fractionDecimalHintText } from '@core/utils/math';
  import Fraction from 'fraction.js';

  import { computed, useAttrs } from 'vue';

  import Tooltip from '../tooltip/Tooltip.vue';

  defineOptions({ inheritAttrs: false });

  const props = defineProps<
    Omit<TooltipOptions, 'class'> & {
      value: Fraction;
      precision?: number;
    }
  >();

  const tooltipOptions = computed(() => {
    const { value: _value, precision: _precision, ...options } = props;
    return options;
  });

  const attrs = useAttrs();

  const decimalHint = computed(() =>
    fractionDecimalHintText(props.value, props.precision),
  );
</script>

<template>
  <span
    v-if="!decimalHint"
    v-bind="attrs"
    >{{ value.toFraction() }}</span
  >
  <Tooltip
    v-else
    v-bind="tooltipOptions"
    :label="decimalHint"
  >
    <template #trigger>
      <span v-bind="attrs">{{ value.toFraction() }}</span>
    </template>
  </Tooltip>
</template>
