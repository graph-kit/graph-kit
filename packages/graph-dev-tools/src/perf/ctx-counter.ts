import type { FrameCalls } from '@graph/perf-harness/types';
import type { AnyFunction } from 'ts-essentials';

type RepaintEvent = 'onBeforeRepaint' | 'onAfterRepaint';

export type RepaintEvents = {
  subscribe: (event: RepaintEvent, callback: () => void) => void;
  unsubscribe: (event: RepaintEvent, callback: () => void) => void;
};

/** how many canvas elements were created, keyed alongside the ctx call names */
export const CANVAS_ELEMENTS_CREATED = 'canvasElementsCreated';

export type CtxCounter = {
  frames: () => FrameCalls[];
  paintMs: () => number[];
  stop: () => void;
};

const methodNamesOf = (prototype: object) =>
  Object.getOwnPropertyNames(prototype).filter((name) => {
    const descriptor = Object.getOwnPropertyDescriptor(prototype, name);
    return typeof descriptor?.value === 'function' && name !== 'constructor';
  });

const patchMethod = (
  target: object,
  name: string,
  wrap: (original: AnyFunction) => AnyFunction,
) => {
  const methods = target as Record<string, AnyFunction>;
  const original = methods[name];
  methods[name] = wrap(original);
  return () => {
    methods[name] = original;
  };
};

export const startCtxCounter = (events: RepaintEvents): CtxCounter => {
  const frames: FrameCalls[] = [];

  const count = (name: string) => {
    const frame = frames.at(-1);
    if (!frame) return;
    frame[name] = (frame[name] ?? 0) + 1;
  };

  const restorePatches: (() => void)[] = [];

  const prototype = CanvasRenderingContext2D.prototype;
  for (const name of methodNamesOf(prototype)) {
    restorePatches.push(
      patchMethod(
        prototype,
        name,
        (original) =>
          function (this: CanvasRenderingContext2D, ...args: unknown[]) {
            count(name);
            return original.apply(this, args);
          },
      ),
    );
  }

  restorePatches.push(
    patchMethod(
      document,
      'createElement',
      (original) =>
        function (this: Document, ...args: unknown[]) {
          if (String(args[0]).toLowerCase() === 'canvas') {
            count(CANVAS_ELEMENTS_CREATED);
          }
          return original.apply(this, args);
        },
    ),
  );

  const paintMs: number[] = [];
  let paintStartedAt: number | undefined;

  const onBeforeRepaint = () => {
    frames.push({});
    paintStartedAt = performance.now();
  };

  const onAfterRepaint = () => {
    if (paintStartedAt === undefined) return;
    paintMs.push(performance.now() - paintStartedAt);
    paintStartedAt = undefined;
  };

  events.subscribe('onBeforeRepaint', onBeforeRepaint);
  events.subscribe('onAfterRepaint', onAfterRepaint);

  return {
    frames: () => frames,
    paintMs: () => paintMs,
    stop: () => {
      for (const restore of restorePatches) restore();
      events.unsubscribe('onBeforeRepaint', onBeforeRepaint);
      events.unsubscribe('onAfterRepaint', onAfterRepaint);
    },
  };
};
