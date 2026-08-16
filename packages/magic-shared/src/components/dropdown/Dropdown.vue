<script setup lang="ts">
  import Dropdown from '@core/components/Dropdown';

  import { menuPanelClasses } from './classes.ts';
</script>

<template>
  <Dropdown :class="menuPanelClasses">
    <template #trigger><slot name="trigger" /></template>
    <slot />
  </Dropdown>
</template>
