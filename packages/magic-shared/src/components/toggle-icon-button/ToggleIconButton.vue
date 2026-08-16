<script setup lang="ts">
  import ToggleIconButton from '@core/components/ToggleIconButton';

  import { toggleIconButton } from './classes.ts';

  // declared rather than left to fall through, so a call site that disables a button
  // without saying why is a type error instead of a silent boolean
  interface Props {
    disabled?: boolean | string;
  }

  defineProps<Props>();

  const pressed = defineModel<boolean>();
</script>

<template>
  <ToggleIconButton
    v-model="pressed"
    :class="toggleIconButton"
    :disabled="disabled"
  />
</template>
