<script setup lang="ts">
  import Tooltip from '../../components/tooltip/Tooltip.vue';
</script>

<template>
  <Tooltip
    label="Disconnected, their seat is held"
    side="left"
  >
    <template #trigger>
      <div class="px-2 text-sm rounded-sm text-white bg-gray-500">Away</div>
    </template>
  </Tooltip>
</template>
