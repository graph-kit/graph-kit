<script setup lang="ts">
  import Shell from '@magic/shared/Shell';
  import { useGraphShell } from '@magic/shared/graph-shell';

  import PointToPoint from './animation/PointToPoint.vue';

  const { shell } = useGraphShell({
    productId: 'dev',
    flags: {
      /*
        the perf harness measures this route, and a graph restored from the last load
        would leave a run measuring that scene on top of the one it asked for
      */
      localStorage: false,
      adjustAnimationSpeed: true,
    },
    core: {
      directed: true,
    },
    onboardingGraph: {
      nodes: [
        { id: 'a', label: 'A', position: { x: -160, y: -80 } },
        { id: 'b', label: 'B', position: { x: 160, y: -80 } },
        { id: 'c', label: 'C', position: { x: 0, y: 120 } },
      ],
      edges: [
        { source: 'a', target: 'b' },
        { source: 'b', target: 'c' },
      ],
    },
  });

  shell.componentSlots.add({
    id: 'animation/point-to-point',
    component: PointToPoint,
    position: 'bottom-middle',
    priority: Infinity,
  });
</script>

<template>
  <Shell />
</template>
