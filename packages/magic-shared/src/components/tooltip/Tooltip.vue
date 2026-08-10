<script setup lang="ts">
  import Tooltip from '@core/components/Tooltip';

  import { useThemeToClasses } from '../../useThemeToClasses.ts';

  const classes = useThemeToClasses({
    dark: 'bg-gray-700 text-white',
    light: 'bg-gray-900 text-white',
  });
</script>

<template>
  <Tooltip :class="classes">
    <template #trigger><slot name="trigger" /></template>
    <slot />
  </Tooltip>
</template>
