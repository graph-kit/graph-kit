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

  // @mdi/js dropped brand icons in v7, so the discord mark is inlined here
  const DISCORD_ICON =
    'M20.317 4.3698a19.7913 19.7913 0 0 0-4.8851-1.5152.0741.0741 0 0 0-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 0 0-.0785-.037 19.7363 19.7363 0 0 0-4.8852 1.515.0699.0699 0 0 0-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 0 0 .0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 0 0 .0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 0 0-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 0 1-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 0 1 .0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 0 1 .0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 0 1-.0066.1276 12.2986 12.2986 0 0 1-1.873.8914.0766.0766 0 0 0-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 0 0 .0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 0 0 .0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 0 0-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z';

  const EMAIL = 'hello@magicgraphs.app';
  const DISCORD_URL = 'https://discord.gg/rRu8Xs9C5';
  const BUG_REPORT_FORM_URL = 'https://forms.gle/AsbbRvvcQm4Lvub36';
  const FEEDBACK_FORM_URL = 'https://forms.gle/P57D2iweFbUdrcXA8';

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
