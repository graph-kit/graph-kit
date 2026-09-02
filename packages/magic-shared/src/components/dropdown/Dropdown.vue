<script setup lang="ts">
  import Dropdown from '@core/components/Dropdown';

  import { menuPanelClasses } from './classes.ts';

  // declared rather than left to fall through so a call site gets it type checked. no
  // default here: undefined lands on the core component's own, so the number lives once
  defineProps<{
    /** the gap the menu keeps from its trigger */
    sideOffset?: number;
    /** the gap the menu keeps from the edge of the viewport it would otherwise run off */
    collisionPadding?: number;
  }>();

  /** optional, so a call site can open the menu itself */
  const open = defineModel<boolean>('open', { default: false });
</script>

<template>
  <Dropdown
    v-model:open="open"
    :class="menuPanelClasses"
    :side-offset="sideOffset"
    :collision-padding="collisionPadding"
  >
    <template #trigger><slot name="trigger" /></template>
    <slot />
  </Dropdown>
</template>
