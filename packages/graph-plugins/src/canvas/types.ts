import { AggregatorControls } from '@canvas/primitives/aggregator/index';
import { CanvasElement } from '@canvas/primitives/aggregator/types';
import {
  AnimatedShapeFactories,
  ShapeRenderer,
} from '@canvas/primitives/animation/index';
import type { ElementsUnderCursor } from '@canvas/surface/events/index';
import { CanvasSurface } from '@canvas/surface/types';
import {
  GraphPlugin,
  WithEvents,
  WithTheme,
} from '@graph/plugins-shared/plugins';
import { DeepReadonly } from 'ts-essentials';

import { CanvasEventMap } from './events.ts';
import { CanvasThemes } from './themes.ts';

export type { ElementsUnderCursor as GraphUnderCursor };

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
