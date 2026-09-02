<script setup lang="ts">
  import Dropdown from '@core/components/Dropdown';

  import { menuPanelClasses } from './classes.ts';

  // declared rather than left to fall through so a call site gets it type checked. no
  // default here: undefined lands on the core component's own, so the number lives once
  defineProps<{
    /** the gap the menu keeps from its trigger */
    sideOffset?: number;
  }>();

  /** passed through so a call site can open the menu itself, see the core component */
  const open = defineModel<boolean>('open', { default: false });
</script>

<template>
  <Dropdown
    v-model:open="open"
    :class="menuPanelClasses"
    :side-offset="sideOffset"
  >
    <template #trigger><slot name="trigger" /></template>
    <slot />
  </Dropdown>
</template>
