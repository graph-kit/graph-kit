<script setup lang="ts">
  import { mdiGithub } from '@mdi/js';

  import Button from '../../components/button/Button.vue';
  import Icon from '../../components/icon/Icon.vue';
  import HStack from '../../components/layout/HStack.vue';
  import VStack from '../../components/layout/VStack.vue';

  const GITHUB_URL = 'https://github.com/graph-kit/graph-kit';
  const DEVPOST_URL = 'https://devpost.com/software/magic-w453qf';
  const TEAM = ['Yona Voss-Andreae', 'Thomas Eykamp'];
</script>

<template>
  <VStack
    gap="3"
    class="border-t border-gray-300 pt-6 dark:border-gray-700"
  >
    <VStack gap="1">
      <h3 class="font-bold tracking-wide opacity-80">Who's behind this?</h3>
      <HStack
        gap="2"
        class="flex-wrap pt-1"
      >
        <span class="text-xs font-semibold uppercase tracking-wide opacity-60">
          Team
        </span>
        <span class="text-sm opacity-80">{{ TEAM.join(' · ') }}</span>
      </HStack>
      <p class="text-sm opacity-80 mt-2">
        The concept started in 2023, in CS240, where over Thanksgiving weekend
        we built a Markov chain sandbox for constructing chains and analyzing
        their properties. The link we posted on Piazza garnered something like a
        dozen upvotes, with a few students even telling us directly how much it
        helped. The fun we had making it, and the way it resonated with students
        got us thinking. But life got in the way, as our concept lay on the
        shelf collecting dust, until a year later, at HackUMass XII. Our
        <a
          :href="DEVPOST_URL"
          target="_blank"
          rel="noreferrer"
          class="underline underline-offset-2"
          >submission</a
        >
        placed very high, even receiving the Wolfram Award. Fast forward two
        years: the idea is to take the fragmented, decade-old ecosystem of
        enthusiast-built tools across computer science and discrete math and
        turn it into one open, modern system, with an API so professors, TAs,
        and tinkerers can build their own experiences on top of it.
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
