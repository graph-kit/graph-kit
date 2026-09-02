<script setup lang="ts">
  // temporary until sets adopts the aggregator
  import Well from '@magic/shared/Well';
  import { useProvidedShell } from '@magic/shared/product';

  import { SETS_ONBOARDING } from './onboarding.ts';

  const shell = useProvidedShell();
</script>

<template>
  <Well
    v-if="shell.onboarding?.isActive.value"
    class="dark:bg-gray-700 pointer-events-none"
  >
    <div
      v-for="item in SETS_ONBOARDING"
      :key="item.display"
      class="flex items-center gap-4 not-last:mb-3"
    >
      <img
        :src="item.imageUrl"
        alt=""
        class="size-12 shrink-0 rounded-lg bg-gray-800 p-2.5"
      />
      <span class="font-bold text-gray-800 dark:text-gray-50">
        {{ item.display }}
      </span>
    </div>
  </Well>
</template>
