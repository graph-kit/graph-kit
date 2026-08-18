import {
  AnimatedShapeFactories,
  ShapeRenderer,
} from '@canvas/primitives/animation/index';
import { CanvasSurface, Coordinate } from '@canvas/surface/types';
import {
  GraphPlugin,
  WithEvents,
  WithTheme,
} from '@graph/plugins-shared/plugins';
import { DeepReadonly } from 'ts-essentials';

import { AggregatorControls } from './aggregator/createAggregator.ts';
import { CanvasElement } from './aggregator/types.ts';
import { CanvasEventMap } from './events.ts';
import { CanvasThemes } from './themes.ts';

export type GraphUnderCursor = {
  /**
   * coordinates of the cursor
   */
  coords: Coordinate;
  /**
   * the canvas elements under the cursor
   */
  elements: CanvasElement[];
  /**
   * the topmost (active) canvas element under the cursor, equivalent to `elements.at(-1)`.
   */
  readonly topElement: CanvasElement | undefined;
};

type BaseCanvasControls = {
  /** canvas rendering surface */
  surface: CanvasSurface;
  /**
   * manages the set of canvas elements rendered on the canvas.
   * use `aggregator.transformers` to register custom canvas elements for your extension.
   */
  aggregator: AggregatorControls;
  /**
   * build the shapes your extension draws. these animate themselves, so a
   * schema change animates rather than snaps without any extra wiring.
   */
  shapes: AnimatedShapeFactories;
  /**
   * the frame lifecycle and timelines behind `shapes`. reach for this to
   * define an animation or drive a draw pass, not to build a shape.
   */
  renderer: ShapeRenderer;
  /**
   * the canvas elements currently under the cursor and the cursor's canvas coordinates.
   *
   * recomputed every frame against the canvas as drawn, so anything your extension adds
   * to the aggregator is hit-tested automatically. `onGraphUnderCursorChange` is triggered
   * on the frames where the answer changes.
   */
  graphUnderCursor: DeepReadonly<GraphUnderCursor>;
  getNodePriority: () => (nodeId: string) => number;
};

export type CanvasControls = WithEvents<
  WithTheme<BaseCanvasControls, CanvasThemes>,
  CanvasEventMap
>;

type CanvasTransitPayload = {
  panX: number;
  panY: number;
  zoom: number;
};

export type CanvasPlugin = GraphPlugin<{
  name: 'canvas';
  controls: CanvasControls;
  transit: CanvasTransitPayload;
  events: CanvasEventMap;
}>;
