<script setup lang="ts">
  import Button from '@core/components/Button';

  import { buttonClasses } from './classes.ts';

  defineSlots<{
    default: () => unknown;
    start?: () => unknown;
    end?: () => unknown;
  }>();
</script>

<template>
  <Button :class="buttonClasses">
    <template #start><slot name="start" /></template>
    <slot />
    <template #end><slot name="end" /></template>
  </Button>
</template>
