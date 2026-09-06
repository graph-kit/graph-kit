<script setup lang="ts">
  import Button from '@magic/shared/Button';
  import HStack from '@magic/shared/HStack';
  import Icon from '@magic/shared/Icon';
  import Popover from '@magic/shared/Popover';
  import VStack from '@magic/shared/VStack';
  import {
    productCategories,
    productThumbnail,
    products,
    useProvidedShell,
  } from '@magic/shared/product';
  import { productHref } from '@magic/shared/ui';
  import { mdiArrowRight } from '@mdi/js';

  const shell = useProvidedShell();

  // categories drive the order, so a group only shows up once a product claims it
  const sections = Object.entries(productCategories)
    .map(([category, name]) => ({
      category,
      name,
      experiences: products.flatMap((product) => {
        const { card } = product.navigation;
        return card?.category === category ? [{ product, card }] : [];
      }),
    }))
    .filter((section) => section.experiences.length > 0);

  const thumbnailFor = (productId: string) =>
    productThumbnail(productId, shell.appearance.state.value);
</script>

<template>
  <Popover
    class="w-[min(62rem,92vw)] max-h-[85vh] overflow-y-auto rounded-2xl bg-gray-100 p-0 shadow-2xl dark:bg-gray-800"
    side="top"
    align="center"
    :side-offset="14"
  >
    <template #trigger>
      <Button
        class="group gap-3 rounded-xl px-8 py-4 text-2xl shadow-lg hover:bg-gray-200 dark:hover:bg-gray-900"
      >
        Go To Experiences
        <template #end>
          <Icon
            class="transition-transform duration-200 group-hover:translate-x-1 group-aria-expanded:-rotate-90 group-aria-expanded:translate-x-0"
            :path="mdiArrowRight"
            :size="26"
          />
        </template>
      </Button>
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
              v-for="{ product, card } in section.experiences"
              :key="product.id"
              :href="productHref(product.id)"
              class="group h-full w-full items-start justify-start gap-3 rounded-xl bg-transparent p-3 text-left hover:bg-gray-200 active:bg-gray-200 dark:bg-transparent dark:hover:bg-gray-900 dark:active:bg-gray-900"
            >
              <img
                :src="thumbnailFor(product.id)"
                :alt="card.name"
                width="56"
                height="56"
                class="size-22 shrink-0 rounded-md object-cover"
              />
              <VStack class="min-w-0 gap-1">
                <HStack class="gap-1">
                  <h4 class="truncate text-sm font-bold">{{ card.name }}</h4>
                  <Icon
                    class="shrink-0 -translate-x-1 opacity-0 transition duration-200 group-hover:translate-x-0 group-hover:opacity-100"
                    :path="mdiArrowRight"
                    :size="16"
                  />
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
