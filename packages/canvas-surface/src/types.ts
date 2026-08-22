import type { AggregatorControls } from '@canvas/primitives/aggregator/index';
import type {
  AnimatedShapeFactories,
  ShapeRenderer,
} from '@canvas/primitives/animation/index';
import type { Coordinate, WorldRect } from '@core/utils/canvas/index';
import { DeepReadonly } from 'ts-essentials';

import type { ComputedRef, Ref } from 'vue';

import type { DrawPattern } from './backgroundPattern.ts';
import type { Camera } from './camera/index.ts';
import type { ElementsUnderCursor, SurfaceEvents } from './events/index.ts';

export type { Coordinate, WorldRect };

export type DrawContent = (ctx: CanvasRenderingContext2D) => void;

export type DrawFns = {
  /**
   * @deprecated paint through {@link CanvasSurface.aggregator} instead. sets is the last
   * consumer, because its clip composed section fills have no primitive to express them
   * as canvas elements yet. this field goes the moment sets migrates.
   */
  content: Ref<DrawContent>;
  backgroundPattern: Ref<DrawPattern>;
  /** holds the canvas on its background pattern alone, leaving content undrawn */
  contentSuspended: Ref<boolean>;
};

export type CanvasRef = {
  canvasRef: (canvas: HTMLCanvasElement) => void;
};

export type CanvasSurface = {
  canvas: Ref<HTMLCanvasElement | undefined>;
  camera: Camera;
  cursorCoordinates: Ref<Coordinate>;
  /** where a mouse event landed in world coordinates, for hit tests against the event itself */
  toWorldCoordinates: (ev: MouseEvent) => Coordinate;
  /** the slice of the world on screen, for fills and clips that cover everything visible */
  visibleWorldRect: ComputedRef<WorldRect>;
  ref: CanvasRef;
  draw: DrawFns;
  /**
   * every canvas element this surface paints, the hit test over them, and the pipeline
   * that decides what they are.
   *
   * ℹ️ painting is not on this surface. the frame is driven by the render loop through
   * `draw.content`, so a consumer registers a transformer and lets the next frame pick
   * it up rather than reaching for the brush itself
   */
  aggregator: AggregatorControls;
  /**
   * build the shapes fed into the aggregator. these animate themselves, so a schema
   * change animates rather than snaps without any extra wiring.
   */
  shapes: AnimatedShapeFactories;
  /** the frame lifecycle and timelines behind `shapes` */
  renderer: ShapeRenderer;
  /** what the pointer is over right now, recomputed against the canvas as drawn */
  elementsUnderCursor: DeepReadonly<ElementsUnderCursor>;
  events: SurfaceEvents;
};
