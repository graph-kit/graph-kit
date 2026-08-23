<script setup lang="ts">
  import Button from '@core/components/Button';

  import { buttonClasses } from './classes.ts';

  // declared rather than left to fall through, so a call site that disables a button
  // without saying why is a type error instead of a silent boolean
  interface Props {
    disabled?: boolean | string;
    /** renders as a real link, so the browser owns the navigation rather than a handler */
    href?: string;
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
    :as="href ? 'a' : 'button'"
    :href="disabled ? undefined : href"
  >
    <template #start><slot name="start" /></template>
    <slot />
    <template #end><slot name="end" /></template>
  </Button>
</template>
