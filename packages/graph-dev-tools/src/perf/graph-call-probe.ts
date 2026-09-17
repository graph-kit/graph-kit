import { startCanvasCallProbe } from './canvas-call-probe.ts';
import type { RepaintEvents } from './ctx-counter.ts';
import { type SceneGraph, buildScene } from './scene.ts';

export const startGraphCallProbe = (
  graph: SceneGraph,
  repaintEvents: RepaintEvents,
) =>
  startCanvasCallProbe({
    repaintEvents,
    scenes: {
      'idle-10': { build: () => buildScene(graph, { nodeCount: 10 }) },
      'idle-25': { build: () => buildScene(graph, { nodeCount: 25 }) },
      'idle-50': { build: () => buildScene(graph, { nodeCount: 50 }) },
      'hover-25': {
        sweepCursor: true,
        build: () => buildScene(graph, { nodeCount: 25 }),
      },
    },
  });
