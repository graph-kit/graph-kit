import { RepaintEvents } from '@graph/dev-tools/perf/frame-timing';
import { startPerfTools } from '@graph/dev-tools/perf/index';
import { SceneGraph } from '@graph/dev-tools/perf/scene';

import { onBeforeUnmount, onMounted } from 'vue';

type DevToolsGraph = SceneGraph & {
  canvas: {
    surface: {
      events: { lifecycle: RepaintEvents };
    };
  };
};

export const useGraphDevTools = (graph: DevToolsGraph) => {
  if (!import.meta.env.DEV) return;
  const cleanups: (() => void)[] = [];
  onMounted(() => {
    /*
      frame timing runs from mount rather than waiting to be asked, since the
      cost is two event subscriptions and some arithmetic, and tooling you have
      to edit code to switch on is tooling that does not get used. the
      expensive half (the canvas call counter) stays off until __graphPerf
      .countCalls() asks for it
    */
    const perf = startPerfTools(graph, graph.canvas.surface.events.lifecycle);
    cleanups.push(perf.stop);
  });
  onBeforeUnmount(() => {
    for (const cleanup of cleanups) cleanup();
    cleanups.length = 0;
  });
};
