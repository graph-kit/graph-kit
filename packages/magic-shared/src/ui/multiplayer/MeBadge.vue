<script setup lang="ts">
  import HStack from '../../components/layout/HStack.vue';
  import Tooltip from '../../components/tooltip/Tooltip.vue';
</script>

<template>
  <Tooltip
    label="This Is You"
    side="left"
  >
    <template #trigger>
      <HStack
        gap="1"
        class="px-2 text-sm rounded-sm text-white bg-orange-500 hover:bg-orange-600"
      >
        Me
      </HStack>
    </template>
  </Tooltip>
</template>
