<script setup lang="ts">
  import Shell from '@magic/shared/Shell';
  import { useGraphShell } from '@magic/shared/graph-shell';

  import ProductRail from './ProductRail.vue';
  import RailExplainer from './RailExplainer.vue';
  import WelcomeBanner from './WelcomeBanner.vue';
  import { provideWelcomeScene } from './useWelcomeScene.ts';
  import { useWelcomeScene } from './useWelcomeScene.ts';

  const { graph, shell } = useGraphShell({
    productId: 'welcome',
    flags: {
      history: false,
      localStorage: false,
      annotations: false,
      linkSharing: false,
      onboarding: false,
      jumpToContent: false,
    },
  });

  // the canvas shows what each product builds rather than being somewhere to build, so
  // everything that authors a graph is off. dragging stays
  graph.anchors.lifecycle.disable();
  graph.interactive.lifecycle.disable();
  graph.marquee.lifecycle.disable();
  graph.focus.lifecycle.disable();

  provideWelcomeScene(useWelcomeScene(graph));

  // the rail is the navigation here, so the menu would only be a second copy of it
  shell.componentSlots.remove('shell/navigation-menu');

  shell.componentSlots.addMany([
    {
      id: 'welcome-banner',
      component: WelcomeBanner,
      position: 'top-middle',
    },
    {
      id: 'welcome-product-rail',
      component: ProductRail,
      position: 'center-left',
    },
    {
      id: 'welcome-explainer',
      component: RailExplainer,
      position: 'bottom-middle',
    },
  ]);
</script>

<template>
  <Shell />
</template>
