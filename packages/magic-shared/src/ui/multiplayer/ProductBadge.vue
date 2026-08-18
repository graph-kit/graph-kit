<script setup lang="ts">
  import { assert } from '@core/utils/assert';

  import { computed } from 'vue';

  import Tooltip from '../../components/tooltip/Tooltip.vue';
  import { ProductId, manifests } from '../../product/index.ts';
  import { assertIsProductId } from '../../product/manifests/isValidProductId.ts';

  const props = defineProps<{
    productId: string;
  }>();

  const productId = computed<ProductId>(() => {
    const productId = props.productId;
    assertIsProductId(productId);
    return productId;
  });

  const tooltipContent = computed(() => {
    const nav = manifests[productId.value].navigation;
    assert('card' in nav, `no navigation card for product ${productId.value}`);
    const productName = nav.card.name;
    return `Currently In: ${productName}`;
  });

  const badgeContent = computed(() => {
    return manifests[productId.value].abbreviatedName;
  });
</script>

<template>
  <Tooltip
    :label="tooltipContent"
    side="left"
  >
    <template #trigger>
      <div class="px-2 text-sm rounded-sm text-white bg-gray-500">
        {{ badgeContent }}
      </div>
    </template>
  </Tooltip>
</template>
