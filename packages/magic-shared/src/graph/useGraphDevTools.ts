import type { RepaintEvents } from '@graph/dev-tools/perf/ctx-counter';
import { startGraphCallProbe } from '@graph/dev-tools/perf/graph-call-probe';
import type { SceneGraph } from '@graph/dev-tools/perf/scene';

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
    const probe = startGraphCallProbe(graph, graph.surface.events.lifecycle);
    cleanups.push(probe.stop);
  });
  onBeforeUnmount(() => {
    for (const cleanup of cleanups) cleanup();
    cleanups.length = 0;
  });
};
