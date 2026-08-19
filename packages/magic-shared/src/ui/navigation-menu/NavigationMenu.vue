<script setup lang="ts">
  import { nullThrows } from '@core/utils/assert';

  import Button from '../../components/button/Button.vue';
  import Dropdown from '../../components/dropdown/Dropdown.vue';
  import MenuItem from '../../components/dropdown/MenuItem.vue';
  import VStack from '../../components/layout/VStack.vue';
  import Well from '../../components/layout/Well.vue';
  import { useProvidedMagic } from '../../product/context.ts';
  import { products } from '../../product/manifests/index.ts';
  import ProductCard from '../product-card/ProductCard.vue';
  import { navigateToProduct } from './navigateToProduct.ts';

  const magic = useProvidedMagic();

  const displayedProducts = products.flatMap((product) =>
    product.navigation.card ? [{ product, card: product.navigation.card }] : [],
  );

  const activeProduct = nullThrows(
    products.find((product) => magic.manifest.id === product.id),
    'product id not recognized',
  );
</script>

<template>
  <Dropdown>
    <template #trigger>
      <Well class="p-0">
        <Button class="px-4 text-xl text-magic dark:text-magic">
          {{ activeProduct.name }}
        </Button>
      </Well>
    </template>
    <VStack gap="0">
      <MenuItem
        v-for="{ product, card } in displayedProducts"
        :key="product.id"
        @click="navigateToProduct(product)"
        class="p-2 dark:hover:bg-gray-900 dark:active:bg-gray-900 active:bg-transparent"
      >
        <ProductCard :card="card" />
      </MenuItem>
    </VStack>
  </Dropdown>
</template>
