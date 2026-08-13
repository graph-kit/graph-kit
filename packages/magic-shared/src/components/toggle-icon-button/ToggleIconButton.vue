<script setup lang="ts">
  import ToggleIconButton from '@core/components/ToggleIconButton';

  import { toggleIconButton } from './classes.ts';

  const pressed = defineModel<boolean>();
</script>

<template>
  <ToggleIconButton
    v-model="pressed"
    :class="toggleIconButton"
  />
</template>
