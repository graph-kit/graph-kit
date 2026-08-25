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
    },
    core: {
      directed: true,
    },
  });

  shell.componentSlots.add({
    id: 'animation/point-to-point',
    component: PointToPoint,
    position: 'bottom-middle',
  });
</script>

<template>
  <Shell />
</template>
