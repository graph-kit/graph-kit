<script setup lang="ts">
  import {
    mdiBugOutline,
    mdiClipboardTextOutline,
    mdiCommentQuoteOutline,
    mdiEmailOutline,
    mdiForumOutline,
    mdiMessageTextOutline,
  } from '@mdi/js';

  import Button from '../../components/button/Button.vue';
  import Icon from '../../components/icon/Icon.vue';
  import HStack from '../../components/layout/HStack.vue';
  import VStack from '../../components/layout/VStack.vue';
  import Popover from '../../components/popover/Popover.vue';

  const EMAIL = 'hello@magicgraphs.app';
  const DISCORD_URL = 'https://discord.gg/rRu8Xs9C5';
  const BUG_REPORT_FORM_URL = 'https://forms.gle/AsbbRvvcQm4Lvub36';
  const FEEDBACK_FORM_URL = 'https://forms.gle/P57D2iweFbUdrcXA8';

  const menus = [
    {
      label: 'Contact Us',
      icon: mdiMessageTextOutline,
      links: [
        {
          icon: mdiEmailOutline,
          label: EMAIL,
          href: `mailto:${EMAIL}`,
        },
        {
          icon: mdiForumOutline,
          label: 'Join our Discord',
          href: DISCORD_URL,
        },
      ],
    },
    {
      label: 'Feedback',
      icon: mdiClipboardTextOutline,
      links: [
        {
          icon: mdiBugOutline,
          label: 'Bug report form',
          href: BUG_REPORT_FORM_URL,
        },
        {
          icon: mdiCommentQuoteOutline,
          label: 'Feedback form',
          href: FEEDBACK_FORM_URL,
        },
      ],
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
      <Popover
        v-for="menu of menus"
        :key="menu.label"
      >
        <template #trigger>
          <Button class="shrink-0 whitespace-nowrap active:scale-100">
            <template #start>
              <Icon
                :path="menu.icon"
                :size="18"
              />
            </template>
            {{ menu.label }}
          </Button>
        </template>

        <VStack
          gap="0"
          class="w-60"
        >
          <a
            v-for="link of menu.links"
            :key="link.href"
            :href="link.href"
            target="_blank"
            rel="noreferrer"
            class="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-gray-200 dark:hover:bg-gray-900"
          >
            <Icon
              :path="link.icon"
              :size="18"
            />
            <span class="flex flex-col">
              <span class="text-sm opacity-90">{{ link.label }}</span>
            </span>
          </a>
        </VStack>
      </Popover>
    </HStack>
  </VStack>
</template>
