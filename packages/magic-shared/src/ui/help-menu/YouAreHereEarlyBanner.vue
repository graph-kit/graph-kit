<script setup lang="ts">
  import {
    mdiBugOutline,
    mdiCommentQuoteOutline,
    mdiEmailOutline,
  } from '@mdi/js';

  import Button from '../../components/button/Button.vue';
  import Icon from '../../components/icon/Icon.vue';
  import HStack from '../../components/layout/HStack.vue';
  import VStack from '../../components/layout/VStack.vue';
  import {
    BUG_REPORT_FORM_URL,
    DISCORD_ICON,
    DISCORD_URL,
    EMAIL,
    FEEDBACK_FORM_URL,
  } from '../external-links.ts';

  const buttons = [
    {
      icon: mdiEmailOutline,
      label: 'Email',
      href: `mailto:${EMAIL}`,
    },
    {
      icon: mdiBugOutline,
      label: 'Report Issue',
      href: BUG_REPORT_FORM_URL,
    },
    {
      icon: mdiCommentQuoteOutline,
      label: 'Share Feedback',
      href: FEEDBACK_FORM_URL,
    },
    {
      icon: DISCORD_ICON,
      label: 'Discord',
      href: DISCORD_URL,
    },
  ];
</script>

<template>
  <VStack
    gap="3"
    class="rounded-lg border border-amber-500 bg-amber-500/10 p-4 dark:bg-amber-400/10"
  >
    <VStack gap="1">
      <h3 class="font-bold tracking-wide">You're here early!</h3>
      <p class="text-sm opacity-80">
        We're looking for students and educators to help shape Magic Graphs. If
        you are interested in partnering or learning more, we'd love to hear
        from you.
      </p>
    </VStack>

    <HStack
      gap="2"
      class="flex-wrap"
    >
      <Button
        v-for="button of buttons"
        :key="button.href"
        as="a"
        :href="button.href"
        target="_blank"
        rel="noreferrer"
        class="shrink-0 whitespace-nowrap"
      >
        <template #start>
          <Icon :path="button.icon" />
        </template>
        {{ button.label }}
      </Button>
    </HStack>
  </VStack>
</template>
