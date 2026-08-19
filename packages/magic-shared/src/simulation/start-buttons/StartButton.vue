<script setup lang="ts">
  import { mdiPlay } from '@mdi/js';

  import Button from '../../components/button/Button.vue';
  import Icon from '../../components/icon/Icon.vue';
</script>

<template>
  <Button>
    <template #start>
      <Icon :path="mdiPlay" />
    </template>
    <slot></slot>
  </Button>
</template>
