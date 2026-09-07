<script setup lang="ts">
  import { mdiClose } from '@mdi/js';

  import Button from '../../components/button/Button.vue';
  import IconButton from '../../components/icon-button/IconButton.vue';
  import HStack from '../../components/layout/HStack.vue';
  import Well from '../../components/layout/Well.vue';
  import { useProvidedOnboardingGraph } from './context.ts';

  const { build, hide, options } = useProvidedOnboardingGraph();
</script>

<template>
  <Well class="pl-4">
    <HStack>
      <h2 class="text-lg font-bold">Need Inspiration?</h2>
      <Button @click="build">{{ options.buildButtonText }}</Button>
      <IconButton
        @click="hide"
        :path="mdiClose"
        label="Close"
        :size="24"
        class="bg-transparent dark:bg-transparent p-1 hover:text-red-500"
      />
    </HStack>
  </Well>
</template>
