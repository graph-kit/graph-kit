<script setup lang="ts">
  import { cn } from '@core/components/cn';

  import Icon from '../../../components/icon/Icon.vue';
  import HStack from '../../../components/layout/HStack.vue';
  import VStack from '../../../components/layout/VStack.vue';

  const props = defineProps<{
    label: string;
    icon: string;
    disabled?: boolean;
  }>();
</script>

<template>
  <VStack
    :gap="4"
    :class="cn(props.disabled && 'opacity-40')"
  >
    <HStack
      :gap="2"
      class="px-1 text-gray-900 dark:text-gray-100"
    >
      <Icon
        :path="icon"
        :size="28"
      />
      <span class="text-xl font-black tracking-wide">
        {{ label }}
      </span>
    </HStack>
    <div
      :inert="disabled"
      :class="cn(props.disabled && 'pointer-events-none')"
    >
      <slot />
    </div>
  </VStack>
</template>
