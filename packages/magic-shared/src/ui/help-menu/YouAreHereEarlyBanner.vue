<script setup lang="ts">
  import { mdiEmailOutline, mdiGithub, mdiMessageTextOutline } from '@mdi/js';

  import Button from '../../components/button/Button.vue';
  import Icon from '../../components/icon/Icon.vue';
  import HStack from '../../components/layout/HStack.vue';
  import VStack from '../../components/layout/VStack.vue';
  import Popover from '../../components/popover/Popover.vue';

  const GITHUB_URL = 'https://github.com/graph-kit/graph-kit';
  const EMAIL = 'hello@magicgraphs.app';

  const contacts = [
    {
      icon: mdiEmailOutline,
      handle: EMAIL,
      href: `mailto:${EMAIL}`,
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

    <HStack gap="2">
      <Button
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

      <Popover>
        <template #trigger>
          <Button class="active:scale-100">
            <template #start>
              <Icon
                :path="mdiMessageTextOutline"
                :size="18"
              />
            </template>
            Contact Us
          </Button>
        </template>

        <VStack
          gap="0"
          class="w-60"
        >
          <a
            v-for="contact of contacts"
            :key="contact.href"
            :href="contact.href"
            target="_blank"
            rel="noreferrer"
            class="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-gray-200 dark:hover:bg-gray-900"
          >
            <Icon
              :path="contact.icon"
              :size="18"
            />
            <span class="flex flex-col">
              <span class="text-sm opacity-90">{{ contact.handle }}</span>
            </span>
          </a>
        </VStack>
      </Popover>
    </HStack>
  </VStack>
</template>
