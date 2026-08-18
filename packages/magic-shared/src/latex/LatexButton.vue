<script setup lang="ts">
  import Button from '@magic/shared/Button';

  import LatexText from './LatexText.vue';

  withDefaults(
    defineProps<{
      size?: number;
    }>(),
    { size: 40 },
  );

  defineSlots<{
    default: () => unknown;
  }>();
</script>

<template>
  <Button :style="{ width: `${size}px`, height: `${size}px` }">
    <LatexText><slot /></LatexText>
  </Button>
</template>
