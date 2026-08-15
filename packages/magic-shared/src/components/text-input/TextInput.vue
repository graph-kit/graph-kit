<script setup lang="ts">
  import TextInput from '@core/components/TextInput';

  import { textInputClasses } from './classes.ts';

  const model = defineModel<string>({ default: '' });
</script>

<template>
  <TextInput
    v-model="model"
    :class="textInputClasses"
  />
</template>
