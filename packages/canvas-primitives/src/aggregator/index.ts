import { ReadonlyEventHub, createEventHub } from '@core/events/createEventHub';
import { DeepReadonly } from 'ts-essentials';

import { ShapeRenderer } from '../animation/index.ts';
import { Coordinate } from '../types/utility.ts';
import { AggregatorEventMap, createAggregatorEventRegistry } from './events.ts';
import { AggregatorTransformer, CanvasElement } from './types.ts';

/**
 * the aggregator as everything downstream of the canvas sees it: register what you paint,
 * read what got painted, ask what the pointer is over. driving the frame is deliberately
 * not here, it belongs to whoever owns the canvas ({@link AggregatorHost}).
 */
export type AggregatorControls = {
  /**
   * every canvas element that survived the pipeline this frame, sorted back-to-front by
   * {@link CanvasElement.priority | priority}
   *
   * ℹ️ this is the authoritative answer to "what is on the canvas". it is last frame's
   * output, rebuilt on every paint, so read it when you need it rather than caching it
   *
   * @returns the drawn elements, read only: to change what is painted, register a
   * {@link AggregatorControls.addTransformer | transformer}
   * @example elements().filter(({ data }) => data?.selectable)
   */
  elements: () => DeepReadonly<CanvasElement[]>;
  /**
   * registers a {@link AggregatorTransformer | transformer} to run each render cycle
   *
   * ℹ️ transformers run in registration order, each handed the elements the previous
   * one returned
   *
   * @param fn the transformer to add
   * @example addTransformer((elements) => { elements.push(myElement); return elements })
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
   * every canvas element at a given coordinate
   *
   * @param coords point in canvas space to test against {@link CanvasElement.shape | element} hitboxes
   * @returns all canvas elements whose hitbox contains coords, ordered back-to-front by paint
   * priority, excluding those flagged {@link CanvasElement.paintOnly | paint only}
   * @example const els = elementsAt({ x: 200, y: 550 })
   * console.log(els) // [node, nodeAnchor] meaning nodeAnchor is above the node
   */
  elementsAt: (coords: Coordinate) => CanvasElement[];
  /** the frame lifecycle, for work that has to sit either side of a paint */
  events: ReadonlyEventHub<AggregatorEventMap>;
};

/**
 * {@link AggregatorControls} plus the frame trigger, handed only to whoever owns the
 * canvas. a consumer that could call `draw` could paint out of band with the render loop
 * that already runs, so the surface keeps this to itself.
 */
export type AggregatorHost = AggregatorControls & {
  /**
   * rebuilds the aggregator from every registered transformer and paints the result,
   * lowest priority first
   *
   * @param ctx the 2d context to paint into
   */
  draw: (ctx: CanvasRenderingContext2D) => void;
};

/**
 * builds the pipeline that decides what a canvas paints. transformers are registered
 * against it, and each frame it reduces them into a sorted list of canvas elements: what
 * gets drawn, and what the pointer can land on.
 *
 * @param renderer the shape renderer that paints each priority group
 * @example const aggregator = createAggregator(renderer)
 * aggregator.addTransformer((elements) => { elements.push(el); return elements })
 */
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
