import { ShapeRenderer } from '@canvas/primitives/animation/index';
import { EventHub } from '@core/events/createEventHub';
import { Coordinate } from '@graph/plugins-shared/drag';
import { DeepReadonly } from 'ts-essentials';

import { CanvasEventMap } from '../events.ts';
import { Aggregator, AggregatorTransformer, CanvasElement } from './types.ts';

export type AggregatorControls = {
  aggregator: () => DeepReadonly<Aggregator>;
  transformers: AggregatorTransformer[];
  updateAggregator: () => void;
  getCanvasElementsAtCoordinate: (coords: Coordinate) => CanvasElement[];
  draw: (ctx: CanvasRenderingContext2D) => void;
};

/**
 * key on {@link CanvasElement.data} marking an element as paint only. it renders like any
 * other, but {@link AggregatorControls.getCanvasElementsAtCoordinate} never returns it, so
 * the pointer lands on whatever sits beneath it instead.
 *
 * @example data: { [CANVAS_ELEMENT_PAINT_ONLY_FIELD_KEY]: true }
 */
export const CANVAS_ELEMENT_PAINT_ONLY_FIELD_KEY = 'paintOnly';

export const createAggregator = (
  { emit }: Pick<EventHub<CanvasEventMap>, 'emit'>,
  renderer: Pick<ShapeRenderer, 'drawGroup' | 'beginFrame' | 'endFrame'>,
): AggregatorControls => {
  let aggregator: Aggregator = [];
  const transformers: AggregatorTransformer[] = [];

  const updateAggregator = () => {
    const resolvedCanvasElements = transformers.reduce<Aggregator>(
      (acc, fn) => fn(acc),
      [],
    );

    aggregator = resolvedCanvasElements.toSorted(
      (a, b) => a.priority - b.priority,
    );
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
    emit('onBeforeDraw', ctx);
    updateAggregator();

    renderer.beginFrame();
    for (const group of groupByPriority(aggregator).values()) {
      renderer.drawGroup(
        ctx,
        group.map((item) => item.shape),
      );
    }
    renderer.endFrame(ctx);

    emit('onDraw', ctx);
  };

  /**
   * Returns all canvas elements at given coordinate
   *
   * @param coords Point in canvas space to test against {@link CanvasElement.shape | element} hitboxes
   * @returns All canvas elements whose hitbox contains coords, ordered back-to-front by paint
   * priority, excluding those flagged {@link CANVAS_ELEMENT_PAINT_ONLY_FIELD_KEY | paint only}
   * @example const els = getCanvasElementsAtCoordinate({ x: 200, y: 550 })
   * console.log(els) // [node, nodeAnchor] meaning nodeAnchor is above the node
   */
  const getCanvasElementsAtCoordinate = (coords: Coordinate) =>
    aggregator.filter(
      ({ shape, data }) =>
        !data?.[CANVAS_ELEMENT_PAINT_ONLY_FIELD_KEY] && shape.hitbox(coords),
    );

  return {
    aggregator: () => aggregator,
    transformers,
    updateAggregator,
    getCanvasElementsAtCoordinate,
    draw,
  };
};
