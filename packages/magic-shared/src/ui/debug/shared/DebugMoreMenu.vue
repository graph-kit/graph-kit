<script setup lang="ts">
  import Dropdown from '../../../components/dropdown/Dropdown.vue';
  import VStack from '../../../components/layout/VStack.vue';
  import { LABEL, PANEL_TYPE } from './classes.ts';

  /*
    the overflow line of a capped list, opened out. the menu portals out of the slot
    layer, so it is free to be wider than the panel that triggered it, which is the
    whole point: this is where a name too long for the column is read in full
  */
  defineProps<{ count: number }>();
</script>

<template>
  <Dropdown
    v-if="count > 0"
    side="bottom"
    align="start"
  >
    <template #trigger>
      <button
        type="button"
        :class="[LABEL, 'w-fit cursor-pointer hover:underline']"
      >
        +{{ count }} more
      </button>
    </template>
    <VStack
      gap="1"
      :class="[PANEL_TYPE, 'w-max']"
    >
      <slot />
    </VStack>
  </Dropdown>
</template>
