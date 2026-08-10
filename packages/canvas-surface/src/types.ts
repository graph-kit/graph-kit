import type { Coordinate } from '@core/utils/canvas/index';
import { ReadonlyEventHub } from '@graph/primitives/events/createEventHub';

import type { Ref } from 'vue';

import type { DrawPattern } from './backgroundPattern.ts';
import type { Camera } from './camera/index.ts';
import { CanvasDOMEvents } from './domEvents.ts';
import { CanvasLifecycleEvents } from './events.ts';

export type { Coordinate };

export type DrawContent = (ctx: CanvasRenderingContext2D) => void;

export type DrawFns = {
  content: Ref<DrawContent>;
  backgroundPattern: Ref<DrawPattern>;
};

export type CanvasRef = {
  canvasRef: (canvas: HTMLCanvasElement) => void;
  cleanup: (canvas: HTMLCanvasElement) => void;
};

export type CanvasProps = {
  canvas: Ref<HTMLCanvasElement | undefined>;
  camera: Omit<Camera, 'cleanup'>;
  cursorCoordinates: Ref<Coordinate>;
  ref: CanvasRef;
  draw: DrawFns;
  lifecycleEvents: ReadonlyEventHub<CanvasLifecycleEvents>;
  domEvents: ReadonlyEventHub<CanvasDOMEvents>;
};

export type UseCanvas = () => CanvasProps;
