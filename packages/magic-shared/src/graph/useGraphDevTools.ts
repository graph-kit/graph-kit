import { RepaintEvents } from '@graph/dev-tools/perf/frame-timing';
import { startPerfTools } from '@graph/dev-tools/perf/index';
import { SceneGraph } from '@graph/dev-tools/perf/scene';

import { onBeforeUnmount, onMounted } from 'vue';

type DevToolsGraph = SceneGraph & {
  surface: {
    events: { lifecycle: RepaintEvents };
  };
};

export const useGraphDevTools = (graph: DevToolsGraph) => {
  if (!import.meta.env.DEV) return;
  const cleanups: (() => void)[] = [];
  onMounted(() => {
    const perf = startPerfTools(graph, graph.surface.events.lifecycle);
    cleanups.push(perf.stop);
  });
  onBeforeUnmount(() => {
    for (const cleanup of cleanups) cleanup();
    cleanups.length = 0;
  });
};
