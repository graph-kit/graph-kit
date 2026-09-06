<script setup lang="ts">
  import Button from '@magic/shared/Button';
  import HStack from '@magic/shared/HStack';
  import Icon from '@magic/shared/Icon';
  import Popover from '@magic/shared/Popover';
  import VStack from '@magic/shared/VStack';
  import Well from '@magic/shared/Well';
  import {
    type ProductCategory,
    productCategories,
    productThumbnail,
    products,
    useProvidedShell,
  } from '@magic/shared/product';
  import { productHref } from '@magic/shared/ui';
  import { mdiArrowRight } from '@mdi/js';

  const shell = useProvidedShell();

  /** the product whose artwork stands in for an experience that has none yet */
  const PLACEHOLDER_THUMBNAIL_PRODUCT_ID = 'min-spanning-trees';

  type UpcomingExperience = {
    name: string;
    description: string;
    category: ProductCategory;
  };

  // experiences that are on the way, listed after the ones that ship
  const upcoming: UpcomingExperience[] = [
    {
      name: 'Network Flow',
      description:
        'Run Ford-Fulkerson and Edmonds-Karp to push the maximum flow through a network and surface its minimum cut.',
      category: 'graph-algorithms',
    },
    {
      name: 'Hash Tables',
      description:
        'Insert and look up keys, watching collisions resolve and the table grow as it fills.',
      category: 'data-structures',
    },
    {
      name: 'State Machines: DFAs + NFAs',
      description:
        'Build automata, feed them strings and step through every state the input drives them into.',
      category: 'discrete-math',
    },
    {
      name: 'Bayesian Networks',
      description:
        'Wire up random variables, set their conditional tables and propagate evidence through the network.',
      category: 'discrete-math',
    },
  ];

  type ExperienceCard = {
    key: string;
    name: string;
    description: string;
    thumbnailProductId: string;
    href?: string;
  };

  // categories drive the order, so a group only shows up once a product claims it
  const sections = Object.entries(productCategories)
    .map(([category, name]) => ({
      category,
      name,
      cards: [
        ...products.flatMap<ExperienceCard>((product) => {
          const { card } = product.navigation;
          if (card?.category !== category) return [];
          return [
            {
              key: product.id,
              name: card.name,
              description: card.description,
              thumbnailProductId: product.id,
              href: productHref(product.id),
            },
          ];
        }),
        ...upcoming.flatMap<ExperienceCard>((experience) =>
          experience.category === category
            ? [
                {
                  key: experience.name,
                  name: experience.name,
                  description: experience.description,
                  thumbnailProductId: PLACEHOLDER_THUMBNAIL_PRODUCT_ID,
                },
              ]
            : [],
        ),
      ],
    }))
    .filter((section) => section.cards.length > 0);

  const thumbnailFor = (productId: string) =>
    productThumbnail(productId, shell.appearance.state.value);
</script>

<template>
  <Popover
    class="w-[min(75rem,92vw)] max-h-[75vh] overflow-y-auto rounded-2xl bg-gray-100 p-0 shadow-2xl dark:bg-gray-800"
    side="top"
    align="center"
    :side-offset="14"
  >
    <template #trigger>
      <Well class="p-0 w-fit">
        <Button
          class="px-6 py-3 text-3xl bg-transparent dark:bg-transparent hover:bg-transparent active:bg-transparent dark:hover:bg-transparent dark:active:bg-transparent"
        >
          View Experiences
        </Button>
      </Well>
    </template>

    <VStack
      :gap="0"
      class="select-none"
    >
      <VStack
        :gap="6"
        class="px-4 py-5"
      >
        <section
          v-for="section in sections"
          :key="section.category"
        >
          <HStack class="gap-3 px-2 pb-2">
            <h3 class="text-lg font-bold text-gray-700 dark:text-gray-200">
              {{ section.name }}
            </h3>
          </HStack>

          <div class="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
            <Button
              v-for="card in section.cards"
              :key="card.key"
              :href="card.href"
              :disabled="card.href ? undefined : `${card.name} coming soon`"
              class="group h-full w-full items-start justify-start gap-3 rounded-xl bg-transparent p-3 text-left hover:bg-gray-200 active:bg-gray-200 dark:bg-transparent dark:hover:bg-gray-900 dark:active:bg-gray-900"
            >
              <img
                :src="thumbnailFor(card.thumbnailProductId)"
                :alt="card.name"
                width="56"
                height="56"
                class="size-22 shrink-0 rounded-md object-cover"
              />
              <VStack class="min-w-0 gap-1">
                <HStack class="gap-1">
                  <h4 class="truncate text-sm font-bold">{{ card.name }}</h4>
                  <Icon
                    v-if="card.href"
                    class="shrink-0 -translate-x-1 opacity-0 transition duration-200 group-hover:translate-x-0 group-hover:opacity-100"
                    :path="mdiArrowRight"
                    :size="16"
                  />
                  <span
                    v-else
                    class="shrink-0 rounded-full bg-gray-300 px-2 py-0.5 text-[0.625rem] font-bold tracking-wide uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                  >
                    Soon
                  </span>
                </HStack>
                <p
                  class="line-clamp-3 text-xs leading-snug font-light text-gray-800 dark:text-gray-300"
                >
                  {{ card.description }}
                </p>
              </VStack>
            </Button>
          </div>
        </section>
      </VStack>
    </VStack>
  </Popover>
</template>
