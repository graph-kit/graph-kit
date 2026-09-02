<script setup lang="ts">
  import Switch from '../../../components/switch/Switch.vue';
  import { LABEL } from './classes.ts';

  defineProps<{ label: string }>();

  const isOn = defineModel<boolean>();
</script>

<template>
  <div class="flex items-center justify-between gap-3">
    <span :class="LABEL">{{ label }}</span>
    <Switch v-model="isOn" />
  </div>
</template>
