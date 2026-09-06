<script setup lang="ts">
  import Button from '@magic/shared/Button';
  import Dialog from '@magic/shared/Dialog';
  import Icon from '@magic/shared/Icon';
  import ProductCard from '@magic/shared/ProductCard';
  import VStack from '@magic/shared/VStack';
  import { products } from '@magic/shared/product';
  import { productHref } from '@magic/shared/ui';
  import { mdiArrowRight } from '@mdi/js';

  const experiences = products.flatMap((product) =>
    product.navigation.card ? [{ product, card: product.navigation.card }] : [],
  );
</script>

<template>
  <Dialog
    class="h-[75vh] max-h-none w-[65vw] max-w-none p-6 shadow-2xl"
    title="Experiences"
    :show-header="false"
  >
    <template #trigger>
      <Button
        class="group gap-3 px-8 py-4 text-2xl hover:bg-gray-300 dark:hover:bg-gray-900"
      >
        Go To Experiences
        <template #end>
          <Icon
            class="transition-transform group-hover:translate-x-1"
            :path="mdiArrowRight"
            :size="26"
          />
        </template>
      </Button>
    </template>

    <VStack>
      <h2
        class="text-center text-3xl font-black tracking-tight select-none mb-7"
      >
        Experiences
      </h2>

      <div class="grid gap-3 sm:grid-cols-2">
        <Button
          v-for="{ product, card } in experiences"
          :key="product.id"
          :href="productHref(product.id)"
          class="h-full justify-center bg-gray-200 p-6 hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-700"
        >
          <ProductCard
            class="w-full"
            :product-id="product.id"
            :card="card"
          />
        </Button>
      </div>
    </VStack>
  </Dialog>
</template>
