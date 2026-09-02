<script setup lang="ts">
  import Shell from '@magic/shared/Shell';
  import { useGraphShell } from '@magic/shared/graph-shell';

  import ActionBar from './ActionBar.vue';
  import WelcomeBanner from './WelcomeBanner.vue';
  import { provideWelcomeScene } from './useWelcomeScene.ts';

  const { graph, shell } = useGraphShell({
    productId: 'welcome',
    flags: {
      history: false,
      localStorage: false,
      annotations: false,
      linkSharing: false,
      onboarding: false,
    },
    core: {
      weighted: false,
    },
  });

  graph.anchors.lifecycle.disable();
  graph.interactive.lifecycle.disable();

  provideWelcomeScene(graph);

  shell.componentSlots.addMany([
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
  <Shell />
</template>
