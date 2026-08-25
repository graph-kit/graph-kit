<script setup lang="ts">
  import HStackVue from '@core/components/HStack';
  import Button from '@magic/shared/Button';
  import Well from '@magic/shared/Well';
  import { useProvidedGraph } from '@magic/shared/graph-shell';

  import { computed } from 'vue';

  const graph = useProvidedGraph();

  const firstNode = computed(() => graph.nodes.value[0]);

  let moveFlag = false;

  const move = () => {
    const pos = graph.positions.get(firstNode.value.id);
    const x = pos.x + (moveFlag ? -300 : 300);
    graph.animation.capture(() => {
      graph.positions.set({ nodeId: firstNode.value.id, update: { x } });
    });
    moveFlag = !moveFlag;
  };

  const scene = {
    nodes: [
      {
        id: 'node-1',
        position: { x: 400, y: 400 },
      },
      {
        id: 'node-2',
        position: { x: 600, y: 600 },
      },
      {
        id: 'node-3',
        position: { x: 600, y: 100 },
      },
      {
        id: 'node-4',
        position: { x: 1000, y: 300 },
      },
    ],
    edges: [
      {
        source: 'node-1',
        target: 'node-2',
      },
    ],
  };

  const createScene = () => {
    graph.animation.capture(() => {
      for (const node of scene.nodes) graph.actions.addNode(node);
      for (const edge of scene.edges) graph.actions.addEdge(edge);
    });
    // setTimeout(() => {
    //   graph.animation.capture(() => {
    //     for (const edge of scene.edges) graph.actions.addEdge(edge);
    //   });
    // }, 1000);
  };

  const destroyScene = () => {
    graph.animation.capture(() => {
      for (const node of scene.nodes) graph.actions.removeNode(node);
    });
  };
</script>

<template>
  <Well>
    <HStackVue>
      <Button
        @click="move"
        :disabled="!firstNode"
        >Move</Button
      >
      <Button @click="createScene">Create Scene</Button>
      <Button @click="destroyScene">Destroy Scene</Button>
    </HStackVue>
  </Well>
</template>
