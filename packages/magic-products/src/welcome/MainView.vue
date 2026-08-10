<script setup lang="ts">
  import { MagicProduct, useGraphProduct } from '@magic/shared/product';

  import ActionBar from './ActionBar.vue';
  import WelcomeBanner from './WelcomeBanner.vue';
  import { provideWelcomeScene } from './useWelcomeScene.ts';

  const graph = useGraphProduct({
    productId: 'welcome',
    localStorage: false,
    core: {
      weighted: false,
    },
    annotations: false,
  });

  graph.anchors.lifecycle.disable();
  graph.interactive.lifecycle.disable();

  provideWelcomeScene(graph);

  graph.magic.componentSlots.addMany([
    {
      id: 'welcome-banner',
      component: WelcomeBanner,
      position: 'top-middle',
    },
    {
      id: 'action-bar',
      component: ActionBar,
      position: 'bottom-middle',
    },
  ]);
</script>

<template>
  <MagicProduct />
</template>
