<script setup lang="ts">
  import { useProvidedMagic } from '../product/context.ts';
  import { SlotPosition } from './types.ts';
  import { useComponentBySlotPosition } from './useComponentsBySlotPosition.ts';

  const magic = useProvidedMagic();

  const componentSlots = useComponentBySlotPosition(magic.componentSlots);

  // maps 1:1 to slot positions in ComponentSlot type
  const props = defineProps<{
    topLeft: string;
    topMiddle: string;
    topRight: string;
    centerLeft: string;
    centerRight: string;
    bottomLeft: string;
    bottomMiddle: string;
    bottomRight: string;
  }>();

  const propKeyByPosition: Record<SlotPosition, keyof typeof props> = {
    'top-left': 'topLeft',
    'top-middle': 'topMiddle',
    'top-right': 'topRight',
    'center-left': 'centerLeft',
    'center-right': 'centerRight',
    'bottom-left': 'bottomLeft',
    'bottom-middle': 'bottomMiddle',
    'bottom-right': 'bottomRight',
  };
</script>

<template>
  <div
    v-for="(components, position) of componentSlots"
    :key="position"
    :class="props[propKeyByPosition[position]]"
  >
    <component
      v-for="{ component, id } of components"
      :key="id"
      :is="component"
    />
  </div>
</template>
