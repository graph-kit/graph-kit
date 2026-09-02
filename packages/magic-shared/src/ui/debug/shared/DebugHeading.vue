<script setup lang="ts">
  import HStack from '../../../components/layout/HStack.vue';
  import { TITLE } from './classes.ts';

  /*
    what a panel is called and the one reading worth seeing without opening it, set the
    same way whether the panel is drawn open or collapsed to this row alone
  */
  defineProps<{ title: string }>();
</script>

<template>
  <HStack class="justify-between">
    <span :class="TITLE">{{ title }}</span>
    <slot name="badge" />
  </HStack>
</template>
