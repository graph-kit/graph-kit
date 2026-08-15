<script setup lang="ts">
  import ToggleButton from '@core/components/ToggleButton';

  import { toggleButton } from './classes.ts';

  const pressed = defineModel<boolean>();
</script>

<template>
  <ToggleButton
    v-model="pressed"
    :class="toggleButton"
  >
    <slot />
  </ToggleButton>
</template>
