/**
 * Counts what a frame actually asks the canvas to do.
 *
 * Data that turns "feels slow" into "3,400 fillRect and 11 drawImage per frame at 10
 * nodes"
 *
 * It patches the prototype rather than wrapping one context, so offscreen
 * canvases are counted too. That matters here: offscreen allocation is the
 * suspected primary cost and it is close to invisible in a sampling profile.
 */
import type { FrameCalls } from '@graph/perf-harness/types';

export type RepaintEvents = {
  subscribe: (event: 'onBeforeRepaint', callback: () => void) => void;
  unsubscribe: (event: 'onBeforeRepaint', callback: () => void) => void;
};

/** how many canvas elements were created, keyed alongside the ctx call names */
export const CANVAS_ELEMENTS_CREATED = 'canvasElementsCreated';

export type CtxCounter = {
  frames: () => FrameCalls[];
  stop: () => void;
};

const methodNamesOf = (prototype: object) =>
  Object.getOwnPropertyNames(prototype).filter((name) => {
    const descriptor = Object.getOwnPropertyDescriptor(prototype, name);
    return typeof descriptor?.value === 'function' && name !== 'constructor';
  });

export const startCtxCounter = (events: RepaintEvents): CtxCounter => {
  const frames: FrameCalls[] = [];

  const count = (name: string) => {
    const frame = frames.at(-1);
    if (!frame) return;
    frame[name] = (frame[name] ?? 0) + 1;
  };

  const prototype = CanvasRenderingContext2D.prototype;
  const originalMethods = new Map<string, (...args: unknown[]) => unknown>();

  for (const name of methodNamesOf(prototype)) {
    const original = (prototype as unknown as Record<string, any>)[name];
    originalMethods.set(name, original);

    (prototype as unknown as Record<string, any>)[name] = function (
      this: CanvasRenderingContext2D,
      ...args: unknown[]
    ) {
      count(name);
      return original.apply(this, args);
    };
  }

  const originalCreateElement = document.createElement;
  document.createElement = function (
    this: Document,
    tagName: string,
    ...rest: unknown[]
  ) {
    if (tagName.toLowerCase() === 'canvas') count(CANVAS_ELEMENTS_CREATED);
    return (originalCreateElement as any).call(this, tagName, ...rest);
  } as typeof document.createElement;

  const onBeforeRepaint = () => frames.push({});
  events.subscribe('onBeforeRepaint', onBeforeRepaint);

  return {
    frames: () => frames,
    stop: () => {
      for (const [name, original] of originalMethods) {
        (prototype as unknown as Record<string, any>)[name] = original;
      }
      document.createElement = originalCreateElement;
      events.unsubscribe('onBeforeRepaint', onBeforeRepaint);
    },
  };
};
