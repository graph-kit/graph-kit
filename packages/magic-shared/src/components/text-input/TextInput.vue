<script setup lang="ts">
  import TextInput from '@core/components/TextInput';

  import { textInputClasses } from './classes.ts';

  // forwarded rather than left to fall through, since it changes behavior rather
  // than appearance and fallthrough attrs are not type checked
  defineProps<{ updateOn?: 'input' | 'change' }>();

  const model = defineModel<string>({ default: '' });
</script>

<template>
  <TextInput
    v-model="model"
    :update-on="updateOn"
    :class="textInputClasses"
  />
</template>
