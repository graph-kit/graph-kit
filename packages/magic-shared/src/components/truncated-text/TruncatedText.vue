<script setup lang="ts">
  import TruncatedText from '@core/components/TruncatedText';
  import { type TruncatedTextProps } from '@core/components/TruncatedText/types';

  // forwarded by shape rather than one at a time, so a prop added to the core component
  // arrives here without this file having to hear about it
  defineProps<TruncatedTextProps>();
</script>

<template>
  <TruncatedText v-bind="$props">
    <slot />
  </TruncatedText>
</template>
