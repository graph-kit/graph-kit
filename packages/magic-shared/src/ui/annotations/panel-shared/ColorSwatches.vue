<script setup lang="ts">
  import HStack from '../../../components/layout/HStack.vue';
  import ColorSwatch from './ColorSwatch.vue';
  import CustomColorSwatch from './CustomColorSwatch.vue';
  import { SWATCH_COLORS } from './options.ts';
</script>

<template>
  <HStack :gap="2">
    <HStack
      :gap="2"
      class="grow"
    >
      <ColorSwatch
        v-for="color of SWATCH_COLORS"
        :key="color.value"
        :name="color.name"
        :hex="color.value"
      />
    </HStack>
    <CustomColorSwatch />
  </HStack>
</template>
