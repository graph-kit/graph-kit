<script setup lang="ts">
  import { nullThrows } from '@core/utils/assert';

  import Button from '../../components/button/Button.vue';
  import Dropdown from '../../components/dropdown/Dropdown.vue';
  import DropdownItem from '../../components/dropdown/DropdownItem.vue';
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
        <Button class="bg-transparent text-xl p-2 px-4 text-magic">
          {{ activeProduct.name }}
        </Button>
      </Well>
    </template>
    <Well class="p-1 bg-transparent">
      <VStack>
        <template
          v-for="{ product, card } in displayedProducts"
          :key="product.id"
        >
          <DropdownItem @click="navigateToProduct(product)">
            <Button
              class="rounded-lg p-2 bg-transparent hover:bg-transparent active:bg-transparent"
            >
              <ProductCard :card="card" />
            </Button>
          </DropdownItem>
        </template>
      </VStack>
    </Well>
  </Dropdown>
</template>
