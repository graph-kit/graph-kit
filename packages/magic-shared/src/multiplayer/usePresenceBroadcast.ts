import { CanvasProps } from '@canvas/surface/types';

import { ProductId } from '../product/manifests/index.ts';
import { MultiplayerHostField } from '../product/types.ts';
import { ProductMultiplayer } from './types.ts';

export const usePresenceBroadcast = (options: {
  surface: CanvasProps;
  productId: ProductId;
  multiplayer: ProductMultiplayer;
  host: MultiplayerHostField;
}) => {
  const { surface, productId, multiplayer, host } = options;

  surface.domEvents.subscribe('onMouseMove', (ev) => {
    const room = multiplayer.room.state.value;
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
      draggedElement: host.draggedElement?.() ?? null,
    });
  });
};
