import type { CanvasCallProbe } from '@graph/perf-harness/types';

import {
  type CtxCounter,
  type RepaintEvents,
  startCtxCounter,
} from './ctx-counter.ts';

const globalSlot = <Key extends keyof Window>(key: Key) => {
  const scope: Window = window;
  return {
    set: (value: Window[Key]) => {
      scope[key] = value;
    },
    clear: () => {
      delete scope[key];
    },
  };
};

const probeGlobal = globalSlot('__canvasCallProbe');

type CanvasCallProbeOptions = {
  repaintEvents: RepaintEvents;
  scenes: CanvasCallProbe['scenes'];
};

export const startCanvasCallProbe = ({
  repaintEvents,
  scenes,
}: CanvasCallProbeOptions) => {
  let counter: CtxCounter | undefined;

  const probe: CanvasCallProbe = {
    scenes,
    counter: {
      start: () => {
        counter = startCtxCounter(repaintEvents);
      },
      get: () => counter?.frames(),
    },
  };

  probeGlobal.set(probe);

  return {
    stop: () => {
      counter?.stop();
      probeGlobal.clear();
    },
  };
};
