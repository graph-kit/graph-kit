<script setup lang="ts">
  import { nullThrows } from '@core/utils/assert';
  import Button from '@magic/shared/Button';
  import HStack from '@magic/shared/HStack';
  import Icon from '@magic/shared/Icon';
  import ProductCard from '@magic/shared/ProductCard';
  import Well from '@magic/shared/Well';
  import { ExplainerText } from '@magic/shared/explainer';
  import { productHref } from '@magic/shared/ui/index';
  import { mdiArrowRight } from '@mdi/js';

  import { useWelcomeScene } from './useWelcomeScene.ts';

  const { activeProduct } = useWelcomeScene();
</script>

<template>
  <!-- the well is the padding-free surface the link paints on, so hovering the
       card fills it corner to corner the way a navigation menu item does -->
  <Well
    v-if="activeProduct"
    class="w-124 p-0 select-none"
  >
    <Button
      :href="productHref(activeProduct.id)"
      class="w-full justify-between gap-4 bg-transparent p-3 hover:bg-gray-100 dark:bg-transparent dark:hover:bg-gray-900"
    >
      <ProductCard
        :product-id="activeProduct.id"
        :card="
          nullThrows(activeProduct.navigation.card, 'no navigation card found')
        "
      />
      <!-- the whole card is the link already, so this reads as a button without being
           a second target, which nesting inside the link would make invalid anyway -->
      <HStack
        class="shrink-0 gap-2 rounded-md bg-gray-300 px-5 py-2 dark:bg-gray-700"
      >
        Open
        <Icon
          :path="mdiArrowRight"
          :size="20"
        />
      </HStack>
    </Button>
  </Well>

  <div
    v-else
    class="pb-8"
  >
    <ExplainerText
      :explainer="{ content: 'Select A [Node]', highlights: [{}] }"
    />
  </div>
</template>
