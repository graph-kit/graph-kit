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
  <Well
    v-if="activeProduct"
    class="w-124 p-3 select-none"
  >
    <HStack class="gap-4">
      <ProductCard
        :product-id="activeProduct.id"
        :card="
          nullThrows(activeProduct.navigation.card, 'no navigation card found')
        "
      />
      <Button
        as="a"
        :href="productHref(activeProduct)"
        class="gap-2 px-5"
      >
        Open
        <template #end>
          <Icon
            :path="mdiArrowRight"
            :size="20"
          />
        </template>
      </Button>
    </HStack>
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
