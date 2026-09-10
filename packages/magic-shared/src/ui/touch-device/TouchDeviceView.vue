<script setup lang="ts">
  import { mdiArrowRight, mdiGithub, mdiMouseOff } from '@mdi/js';
  import { useRoute } from 'nuxt/app';

  import { computed } from 'vue';

  import Button from '../../components/button/Button.vue';
  import Icon from '../../components/icon/Icon.vue';
  import HStack from '../../components/layout/HStack.vue';
  import VStack from '../../components/layout/VStack.vue';
  import { manifests, products } from '../../product/manifests/index.ts';
  import { productPath } from '../../product/manifests/paths.ts';
  import { productThumbnail } from '../../product/manifests/thumbnail.ts';
  import { useDocumentAppearance } from '../appearance/useDocumentAppearance.ts';
  import { DISCORD_ICON, DISCORD_URL, GITHUB_URL } from '../external-links.ts';
  import {
    PREVIEW_HEIGHT,
    PREVIEW_WIDTH,
    productPreviews,
  } from './previews.ts';

  // this view stands in for the whole page, so the theming the shell would have owned
  // is on it instead
  const appearance = useDocumentAppearance();

  const route = useRoute();

  // static hosting serves these paths with a trailing slash, which productPath omits
  const requestedPath = computed(() => route.path.replace(/\/+$/, '') || '/');

  /** the experience this visitor followed a link to, so the page can name it */
  const requested = computed(() => {
    const product = products.find(
      (candidate) => productPath(candidate.id) === requestedPath.value,
    );
    return product?.navigation.card ? product : undefined;
  });

  const experiences = computed(() =>
    products.filter((product) => product.navigation.card),
  );

  // artwork legible on light is rarely legible on dark, so it follows the appearance
  const thumbnailFor = (productId: string) =>
    productThumbnail(productId, appearance.state.value);

  const footerLinks = [
    { icon: DISCORD_ICON, label: 'Discord', href: DISCORD_URL },
    { icon: mdiGithub, label: 'GitHub', href: GITHUB_URL },
  ];
</script>

<template>
  <main
    class="h-dvh overflow-y-auto bg-gray-200 text-gray-700 dark:bg-gray-900 dark:text-white"
  >
    <VStack
      gap="8"
      class="mx-auto w-full max-w-2xl px-5 py-10"
    >
      <VStack
        gap="1"
        class="select-none"
      >
        <h1 class="text-magic-dark text-4xl text-center font-black">
          Magic Graphs
        </h1>
      </VStack>

      <VStack
        gap="3"
        class="rounded-lg border border-amber-500 bg-amber-500/10 p-4 dark:bg-amber-400/10"
      >
        <HStack>
          <h2 class="text-xl font-bold">We aren't on touch devices yet!</h2>
        </HStack>
        <p class="text-gray-800 dark:text-gray-200">
          Open
          <span class="font-bold">magicgraphs.app</span> on a laptop or desktop.
        </p>
        <p
          v-if="requested"
          class="text-gray-800 dark:text-gray-200"
        >
          You were headed for
          <span class="font-bold">{{ requested.name }}</span
          >. It will still be there, pinky promise.
        </p>
      </VStack>

      <VStack
        gap="4"
        as="section"
      >
        <VStack
          v-for="(preview, index) of productPreviews"
          :key="preview.productId"
          as="figure"
          gap="2"
        >
          <img
            :src="preview.src"
            :alt="`${manifests[preview.productId].name} open in Magic Graphs`"
            :width="PREVIEW_WIDTH"
            :height="PREVIEW_HEIGHT"
            :loading="index === 0 ? 'eager' : 'lazy'"
            class="w-full rounded-lg border border-gray-400 dark:border-gray-800"
          />
          <VStack
            as="figcaption"
            gap="1"
          >
            <h3 class="font-bold">{{ manifests[preview.productId].name }}</h3>
            <p class="text-sm text-gray-700 dark:text-gray-300">
              {{ preview.caption }}
            </p>
          </VStack>
        </VStack>
      </VStack>

      <VStack
        gap="4"
        as="section"
      >
        <h2 class="text-2xl font-bold">{{ experiences.length }} Experiences</h2>

        <HStack
          v-for="experience of experiences"
          :key="experience.id"
          gap="4"
          class="items-start"
        >
          <img
            :src="thumbnailFor(experience.id)"
            alt=""
            width="64"
            height="64"
            loading="lazy"
            class="size-16 shrink-0 rounded-md object-cover"
          />
          <VStack gap="1">
            <h3 class="font-bold">{{ experience.name }}</h3>
            <p class="text-sm text-gray-700 dark:text-gray-300">
              {{ experience.navigation.card?.description }}
            </p>
          </VStack>
        </HStack>
      </VStack>

      <VStack
        gap="3"
        as="footer"
        class="border-t border-gray-400 pt-6 dark:border-gray-700"
      >
        <HStack
          gap="2"
          class="flex-wrap"
        >
          <Button
            v-for="link of footerLinks"
            :key="link.href"
            :href="link.href"
            target="_blank"
            rel="noreferrer"
            class="shrink-0 whitespace-nowrap dark:bg-gray-800"
          >
            <template #start>
              <Icon :path="link.icon" />
            </template>
            {{ link.label }}
            <template #end>
              <Icon
                :path="mdiArrowRight"
                :size="20"
              />
            </template>
          </Button>
        </HStack>
      </VStack>
    </VStack>
  </main>
</template>
