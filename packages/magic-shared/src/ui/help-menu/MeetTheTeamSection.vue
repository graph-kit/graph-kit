<script setup lang="ts">
  import { mdiGithub } from '@mdi/js';

  import Button from '../../components/button/Button.vue';
  import Icon from '../../components/icon/Icon.vue';
  import HStack from '../../components/layout/HStack.vue';
  import VStack from '../../components/layout/VStack.vue';

  const GITHUB_URL = 'https://github.com/graph-kit/graph-kit';
  // const DEVPOST_URL = 'https://devpost.com/software/magic-w453qf';
</script>

<template>
  <VStack
    gap="3"
    class="border-t border-gray-300 pt-6 dark:border-gray-700"
  >
    <VStack gap="1">
      <h3 class="font-bold tracking-wide opacity-80">Graph Kit</h3>
      <p class="text-sm opacity-80">
        Magic Graphs is powered by Graph Kit, a typescript-native,
        framework-agnostic Graph SDK actively being developed by Yona
        Voss-Andreae and Thomas Eykamp.
      </p>
    </VStack>

    <HStack
      gap="2"
      class="flex-wrap"
    >
      <Button
        class="shrink-0 whitespace-nowrap"
        :href="GITHUB_URL"
        target="_blank"
        rel="noreferrer"
      >
        <template #start>
          <Icon
            :path="mdiGithub"
            :size="18"
          />
        </template>
        GitHub
      </Button>
    </HStack>
  </VStack>
</template>
