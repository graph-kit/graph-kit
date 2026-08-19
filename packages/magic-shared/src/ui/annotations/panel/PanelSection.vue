<script setup lang="ts">
  import Icon from '../../../components/icon/Icon.vue';
  import HStack from '../../../components/layout/HStack.vue';
  import VStack from '../../../components/layout/VStack.vue';

  defineProps<{ label: string; icon: string }>();
</script>

<template>
  <VStack :gap="4">
    <HStack class="text-gray-700 dark:text-gray-100">
      <Icon
        :path="icon"
        :size="28"
      />
      <span class="text-xl font-bold tracking-wide">
        {{ label }}
      </span>
    </HStack>
    <slot />
  </VStack>
</template>
