import { Coordinate } from '@core/utils/canvas/index';

import { CanvasSurface } from '../types.ts';

/** pans the camera to a point in the world, leaving the zoom alone */
export const centerCameraOn = (
  surface: Pick<CanvasSurface, 'camera' | 'visibleWorldRect'>,
  worldCoordinate: Coordinate,
) => {
  const viewport = surface.visibleWorldRect.value;
  const { zoom } = surface.camera.state;

  // the viewport is the canvas divided by zoom, so multiplying back gives the css
  // size the pan is measured in
  const canvasWidth = viewport.width * zoom.value;
  const canvasHeight = viewport.height * zoom.value;

  surface.camera.actions.moveTo({
    panX: canvasWidth / 2 - worldCoordinate.x * zoom.value,
    panY: canvasHeight / 2 - worldCoordinate.y * zoom.value,
    zoom: zoom.value,
  });
};
