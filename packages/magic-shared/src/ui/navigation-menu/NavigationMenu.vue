<script setup lang="ts">
  import { nullThrows } from '@core/utils/assert';

  import { computed } from 'vue';

  import Button from '../../components/button/Button.vue';
  import Dropdown from '../../components/dropdown/Dropdown.vue';
  import MenuItem from '../../components/dropdown/MenuItem.vue';
  import VStack from '../../components/layout/VStack.vue';
  import Well from '../../components/layout/Well.vue';
  import { useProvidedShell } from '../../product/context.ts';
  import { products } from '../../product/manifests/index.ts';
  import { getNavigationName } from '../../product/manifests/navigationName.ts';
  import { ProductManifest } from '../../product/manifests/types.ts';
  import ProductCard from '../product-card/ProductCard.vue';
  import { productHref } from './navigateToProduct.ts';

  const shell = useProvidedShell();

  const displayedProducts = products.flatMap((product) =>
    product.navigation.card ? [{ product, card: product.navigation.card }] : [],
  );

  const activeProduct = nullThrows(
    products.find((product) => shell.manifest.id === product.id),
    'product id not recognized',
  );

  const inRoom = computed(
    () => shell.multiplayer?.room.state.value.connected === true,
  );

  const disabledReason = (product: ProductManifest) =>
    inRoom.value && !product.multiplayer
      ? `${getNavigationName(product.id)} does not support collaborative sessions`
      : undefined;
</script>

<template>
  <Dropdown>
    <template #trigger>
      <Well class="p-0 relative w-fit max-w-[20vw]">
        <Button class="px-4 text-xl text-magic dark:text-magic w-full">
          <span class="truncate w-full">
            {{ activeProduct.name }}
          </span>
        </Button>
      </Well>
    </template>
    <VStack gap="0">
      <MenuItem
        v-for="{ product, card } in displayedProducts"
        :key="product.id"
        :href="productHref(product.id)"
        :disabled="disabledReason(product)"
        class="p-2 dark:hover:bg-gray-900 dark:active:bg-gray-900 active:bg-transparent"
      >
        <ProductCard
          :product-id="product.id"
          :card="card"
        />
      </MenuItem>
    </VStack>
  </Dropdown>
</template>
