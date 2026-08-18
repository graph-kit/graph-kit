<script setup lang="ts">
  import HStack from '../../components/layout/HStack.vue';
  import HistoryButtons from '../undo-redo/HistoryButtons.vue';
  import ZoomButtons from '../zoom/ZoomButtons.vue';
</script>

<template>
  <HStack>
    <HistoryButtons />
    <ZoomButtons />
  </HStack>
</template>
