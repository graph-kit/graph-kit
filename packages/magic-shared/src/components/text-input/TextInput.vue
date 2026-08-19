<script setup lang="ts">
  import TextInput from '@core/components/TextInput';

  import { textInputClasses } from './classes.ts';

  withDefaults(defineProps<{ invalid?: boolean }>(), { invalid: false });

  const model = defineModel<string>({ default: '' });
</script>

<template>
  <TextInput
    v-model="model"
    :invalid="invalid"
    :class="textInputClasses"
  />
</template>
