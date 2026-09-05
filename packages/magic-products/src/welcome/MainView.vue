<script setup lang="ts">
  import Shell from '@magic/shared/Shell';
  import { useGraphShell } from '@magic/shared/graph-shell';

  import ProductRail from './ProductRail.vue';
  import RailExplainer from './RailExplainer.vue';
  import WelcomeBanner from './WelcomeBanner.vue';
  import { provideWelcomeScene } from './useProvidedWelcomeScene.ts';
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

  // the canvas here shows what each product builds rather than being somewhere to build,
  // so everything that authors a graph is off. dragging stays, since pushing the nodes
  // around is the one thing worth being able to do to a graph you are only looking at
  graph.anchors.lifecycle.disable();
  graph.interactive.lifecycle.disable();
  graph.marquee.lifecycle.disable();
  graph.focus.lifecycle.disable();

  provideWelcomeScene(useWelcomeScene(graph));

  // the rail is the navigation on this page, so the menu that does that job everywhere
  // else would only be a second copy of it
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
