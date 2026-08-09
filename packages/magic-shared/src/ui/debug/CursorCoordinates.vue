<script setup lang="ts">
  import { computed } from 'vue';

  import HStack from '../../components/layout/HStack.vue';
  import VStack from '../../components/layout/VStack.vue';
  import Well from '../../components/layout/Well.vue';
  import { useProvidedMagic } from '../../product/context.ts';

  const magic = useProvidedMagic();
  const coords = magic.surface.cursorCoordinates;
  const x = computed(() => Math.round(coords.value.x));
  const y = computed(() => Math.round(coords.value.y));
</script>

<template>
  <Well class="w-42">
    <VStack class="text-sm">
      <h1>Cursor Coordinates</h1>
      <HStack>
        <h2>X = {{ x }}</h2>
        <h2>Y = {{ y }}</h2>
      </HStack>
    </VStack>
  </Well>
</template>
