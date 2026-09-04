import type { ReadonlyEventHub } from '@core/events/createEventHub';

import { computed, ref } from 'vue';

import type { Camera } from '../camera/index.ts';
import type { CanvasBoundEvents } from '../events/index.ts';
import { Coordinate } from '../types.ts';

/**
 * tracks the cursor position in world coordinates, meaning the camera's pan and
 * zoom have already been undone.
 */
export const useWorldCoordinates = (
  { panX, panY, zoom }: Camera['state'],
  canvasEvents: Pick<ReadonlyEventHub<CanvasBoundEvents>, 'subscribe'>,
) => {
  const toWorld = ({ x, y }: Coordinate): Coordinate => ({
    x: (x - panX.value) / zoom.value,
    y: (y - panY.value) / zoom.value,
  });

  // offset is already relative to the canvas the listener sits on, so nothing is measured
  const toWorldCoordinates = (ev: MouseEvent) =>
    toWorld({ x: ev.offsetX, y: ev.offsetY });

  const screenCoordinates = ref<Coordinate>();

  canvasEvents.subscribe(
    'onMouseMove',
    (ev) => (screenCoordinates.value = { x: ev.offsetX, y: ev.offsetY }),
  );

  const worldCoordinates = computed<Coordinate | undefined>(() =>
    screenCoordinates.value ? toWorld(screenCoordinates.value) : undefined,
  );

  return { worldCoordinates, toWorldCoordinates };
};
