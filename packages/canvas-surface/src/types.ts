import type { Coordinate, WorldRect } from '@core/utils/canvas/index';
import { ReadonlyEventHub } from '@graph/primitives/events/createEventHub';

import type { ComputedRef, Ref } from 'vue';

import type { DrawPattern } from './backgroundPattern.ts';
import type { Camera } from './camera/index.ts';
import { CanvasDOMEvents } from './domEvents.ts';
import { CanvasLifecycleEvents } from './events.ts';

export type { Coordinate, WorldRect };

export type DrawContent = (ctx: CanvasRenderingContext2D) => void;

export type DrawFns = {
  content: Ref<DrawContent>;
  backgroundPattern: Ref<DrawPattern>;
  /** holds the canvas on its background pattern alone, leaving content undrawn */
  contentSuspended: Ref<boolean>;
};

export type CanvasRef = {
  canvasRef: (canvas: HTMLCanvasElement) => void;
  cleanup: (canvas: HTMLCanvasElement) => void;
};

export type CanvasSurface = {
  canvas: Ref<HTMLCanvasElement | undefined>;
  camera: Omit<Camera, 'cleanup'>;
  cursorCoordinates: Ref<Coordinate>;
  /** where a mouse event landed in world coordinates, for hit tests against the event itself */
  toWorldCoordinates: (ev: MouseEvent) => Coordinate;
  /** the slice of the world on screen, for fills and clips that cover everything visible */
  visibleWorldRect: ComputedRef<WorldRect>;
  ref: CanvasRef;
  draw: DrawFns;
  lifecycleEvents: ReadonlyEventHub<CanvasLifecycleEvents>;
  events: ReadonlyEventHub<CanvasDOMEvents>;
};
