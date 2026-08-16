<script setup lang="ts">
  import Button from '@core/components/Button';

  import { buttonClasses } from './classes.ts';

  // declared rather than left to fall through, so a call site that disables a button
  // without saying why is a type error instead of a silent boolean
  interface Props {
    disabled?: boolean | string;
  }

  defineProps<Props>();

  defineSlots<{
    default: () => unknown;
    start?: () => unknown;
    end?: () => unknown;
  }>();
</script>

<template>
  <Button
    :class="buttonClasses"
    :disabled="disabled"
  >
    <template #start><slot name="start" /></template>
    <slot />
    <template #end><slot name="end" /></template>
  </Button>
</template>
