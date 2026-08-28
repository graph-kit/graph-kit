<script setup lang="ts">
  import Switch from '@core/components/Switch';

  import { switchThumb, switchTrack } from './classes.ts';

  defineProps<{ disabled?: boolean }>();

  const checked = defineModel<boolean>();
</script>

<template>
  <Switch
    v-model="checked"
    :disabled="disabled"
    :class="switchTrack"
    :thumb-class="switchThumb"
  />
</template>
