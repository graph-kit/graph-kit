<script setup lang="ts">
  import { products } from '@magic/shared/product';
  import { useElementBounding } from '@vueuse/core';

  import { ref, watchEffect } from 'vue';

  import RailCard from './RailCard.vue';
  import { useProvidedWelcomeScene } from './useProvidedWelcomeScene.ts';

  /** breathing room between the rail and the graph it is centered against */
  const CANVAS_GAP_PX = 24;

  const scene = useProvidedWelcomeScene();

  const rail = ref<HTMLElement>();
  const { right } = useElementBounding(rail);

  // the rail floats over the canvas, so the scene is told how much of it is spoken for
  // rather than guessing at a width that changes with the window. rounded, since the sub
  // pixel churn a resize observer reports would otherwise read as the rail changing size
  watchEffect(() => {
    scene.reservedLeftPx.value = right.value
      ? Math.round(right.value + CANVAS_GAP_PX)
      : 0;
  });

  const cards = products.flatMap((product) =>
    product.navigation.card ? [{ product, card: product.navigation.card }] : [],
  );
</script>

<template>
  <div
    ref="rail"
    class="flex w-fit flex-col gap-2 select-none"
    @pointerleave="scene.hover(undefined)"
  >
    <RailCard
      v-for="{ product, card } in cards"
      :key="product.id"
      :product-id="product.id"
      :card="card"
    />
  </div>
</template>
