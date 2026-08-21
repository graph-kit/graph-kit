import { ReadonlyEventHub, createEventHub } from '@core/events/createEventHub';
import { DeepReadonly } from 'ts-essentials';

import { ShapeRenderer } from '../animation/index.ts';
import { Coordinate } from '../types/utility.ts';
import { AggregatorEventMap, createAggregatorEventRegistry } from './events.ts';
import { Aggregator, AggregatorTransformer, CanvasElement } from './types.ts';

export type AggregatorControls = {
  aggregator: () => DeepReadonly<Aggregator>;
  /**
   * registers a {@link AggregatorTransformer | transformer} to run each render cycle
   *
   * ℹ️ transformers run in registration order, each handed the aggregator the previous
   * one returned
   *
   * @param fn the transformer to add
   * @example addTransformer((agg) => { agg.push(myElement); return agg })
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
  getCanvasElementsAtCoordinate: (coords: Coordinate) => CanvasElement[];
  draw: (ctx: CanvasRenderingContext2D) => void;
  events: ReadonlyEventHub<AggregatorEventMap>;
};

export const createAggregator = (
  renderer: Pick<ShapeRenderer, 'drawGroup' | 'beginFrame' | 'endFrame'>,
): AggregatorControls => {
  const events = createEventHub(createAggregatorEventRegistry());

  let aggregator: Aggregator = [];
  const transformers: AggregatorTransformer[] = [];

  const updateAggregator = () => {
    // snapshot: a transformer that adds or removes one mid pass would otherwise
    // shift the indicies out from under the reduce
    const resolvedCanvasElements = [...transformers].reduce<Aggregator>(
      (acc, fn) => fn(acc),
      [],
    );

    aggregator = resolvedCanvasElements.toSorted(
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

  const groupByPriority = (elements: Aggregator): Map<number, Aggregator> => {
    const groups = new Map<number, Aggregator>();
    for (const item of elements) {
      const group = groups.get(item.priority) ?? [];
      group.push(item);
      groups.set(item.priority, group);
    }
    return groups;
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    events.emit('onBeforeDraw', ctx);
    updateAggregator();

    renderer.beginFrame();
    for (const group of groupByPriority(aggregator).values()) {
      renderer.drawGroup(
        ctx,
        group.map((item) => item.shape),
      );
    }
    renderer.endFrame(ctx);

    events.emit('onDraw', ctx);
  };

  /**
   * Returns all canvas elements at given coordinate
   *
   * @param coords Point in canvas space to test against {@link CanvasElement.shape | element} hitboxes
   * @returns All canvas elements whose hitbox contains coords, ordered back-to-front by paint
   * priority, excluding those flagged {@link CanvasElement.paintOnly | paint only}
   * @example const els = getCanvasElementsAtCoordinate({ x: 200, y: 550 })
   * console.log(els) // [node, nodeAnchor] meaning nodeAnchor is above the node
   */
  const getCanvasElementsAtCoordinate = (coords: Coordinate) =>
    aggregator.filter(
      ({ shape, paintOnly }) => !paintOnly && shape.hitbox(coords),
    );

  return {
    aggregator: () => aggregator,
    addTransformer,
    removeTransformer,
    getCanvasElementsAtCoordinate,
    draw,
    events,
  };
};
