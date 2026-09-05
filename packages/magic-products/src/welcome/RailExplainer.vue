<script setup lang="ts">
  import { ExplainerText } from '@magic/shared/explainer';
  import { products } from '@magic/shared/product';

  import { computed } from 'vue';

  import { useProvidedWelcomeScene } from './useProvidedWelcomeScene.ts';

  const scene = useProvidedWelcomeScene();

  // reads the card the rail is lighting rather than the graph on the canvas, so pointing
  // at a product with no example of its own still says what that product is
  const description = computed(() => {
    const productId = scene.hovered.value ?? scene.active.value;
    const product = products.find(({ id }) => id === productId);
    return product?.navigation.card?.description;
  });
</script>

<template>
  <div
    v-if="description"
    class="max-w-3xl pb-8 select-none"
  >
    <ExplainerText :explainer="{ content: description }" />
  </div>
</template>
