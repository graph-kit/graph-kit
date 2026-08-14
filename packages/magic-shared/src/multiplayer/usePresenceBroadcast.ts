import { CanvasProps } from '@canvas/surface/types';

import { ProductId } from '../product/manifests/index.ts';
import { MultiplayerControls } from './types.ts';

export const usePresenceBroadcast = (options: {
  surface: CanvasProps;
  productId: ProductId;
  multiplayer: MultiplayerControls;
}) => {
  const { surface, productId, multiplayer } = options;

  surface.domEvents.subscribe('onMouseMove', (ev) => {
    const room = multiplayer.room.value;
    if (!room.connected) return;

    const camera = surface.camera.state;

    room.controls.updatePresence({
      productId,
      cursorPosition: surface.toWorldCoordinates(ev),
      cameraState: {
        panX: camera.panX.value,
        panY: camera.panY.value,
        zoom: camera.zoom.value,
      },
    });
  });
};
