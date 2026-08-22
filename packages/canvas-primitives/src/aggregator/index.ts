import { ReadonlyEventHub, createEventHub } from '@core/events/createEventHub';
import { DeepReadonly } from 'ts-essentials';

import { ShapeRenderer } from '../animation/index.ts';
import { Coordinate } from '../types/utility.ts';
import { AggregatorEventMap, createAggregatorEventRegistry } from './events.ts';
import { AggregatorTransformer, CanvasElement } from './types.ts';

/** the aggregator as plugins see it. `draw` is only on {@link AggregatorHost} */
export type AggregatorControls = {
  /**
   * the elements drawn in the last frame, lowest priority first. the array is replaced
   * every frame, so call this when you need it instead of storing the result
   */
  elements: () => DeepReadonly<CanvasElement[]>;
  /**
   * transformers run every frame in the order they were added, each getting the array
   * the previous one returned
   */
  addTransformer: (fn: AggregatorTransformer) => void;
  /**
   * unregisters a {@link AggregatorTransformer | transformer}, leaving the order of the
   * remaining ones untouched. a no-op if it was never added
   *
   * ℹ️ removes a single registration, so a transformer added twice must be removed twice
   *
   * @param fn the same function reference that was handed to {@link AggregatorControls.addTransformer | addTransformer}
   * @example removeTransformer(myTransformer)
   */
  removeTransformer: (fn: AggregatorTransformer) => void;
  /**
   * elements whose hitbox contains `coords`, in canvas space. ordered back to front, so
   * the last one is on top. skips {@link CanvasElement.paintOnly | paint only} elements
   */
  elementsAt: (coords: Coordinate) => CanvasElement[];
  events: ReadonlyEventHub<AggregatorEventMap>;
};

/** only the canvas surface holds this. plugins draw through `surface.draw.content` */
export type AggregatorHost = AggregatorControls & {
  draw: (ctx: CanvasRenderingContext2D) => void;
};

export const createAggregator = (
  renderer: Pick<ShapeRenderer, 'drawGroup' | 'beginFrame' | 'endFrame'>,
): AggregatorHost => {
  const events = createEventHub(createAggregatorEventRegistry());

  let elements: CanvasElement[] = [];
  const transformers: AggregatorTransformer[] = [];

  const rebuild = () => {
    // snapshot: a transformer that adds or removes one mid pass would otherwise
    // shift the indicies out from under the reduce
    const resolvedCanvasElements = [...transformers].reduce<CanvasElement[]>(
      (acc, fn) => fn(acc),
      [],
    );

    elements = resolvedCanvasElements.toSorted(
      (a, b) => a.priority - b.priority,
    );
  };

  const addTransformer = (fn: AggregatorTransformer) => {
    transformers.push(fn);
  };

  const removeTransformer = (fn: AggregatorTransformer) => {
    const index = transformers.indexOf(fn);
    if (index !== -1) transformers.splice(index, 1);
  };

  const groupByPriority = (
    toGroup: CanvasElement[],
  ): Map<number, CanvasElement[]> => {
    const groups = new Map<number, CanvasElement[]>();
    for (const item of toGroup) {
      const group = groups.get(item.priority) ?? [];
      group.push(item);
      groups.set(item.priority, group);
    }
    return groups;
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    events.emit('onBeforeDraw', ctx);
    rebuild();

    renderer.beginFrame();
    for (const group of groupByPriority(elements).values()) {
      renderer.drawGroup(
        ctx,
        group.map((item) => item.shape),
      );
    }
    renderer.endFrame(ctx);

    events.emit('onDraw', ctx);
  };

  const elementsAt = (coords: Coordinate) =>
    elements.filter(
      ({ shape, paintOnly }) => !paintOnly && shape.hitbox(coords),
    );

  return {
    elements: () => elements,
    addTransformer,
    removeTransformer,
    elementsAt,
    draw,
    events,
  };
};
