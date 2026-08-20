import { CanvasSurface } from '@canvas/surface/types';
import { AnnotationsControls } from '@core/annotations/index';
import { Point } from '@multiplayer/protocol/room';

import { ProductId } from '../product/manifests/index.ts';
import { MultiplayerHostField } from '../product/types.ts';
import { ProductMultiplayer } from './types.ts';

export const usePresenceBroadcast = (options: {
  surface: CanvasSurface;
  productId: ProductId;
  multiplayer: ProductMultiplayer;
  host: MultiplayerHostField;
  annotations?: AnnotationsControls;
}) => {
  const { surface, productId, multiplayer, host, annotations } = options;

  let cursorPosition: Point | null = null;

  const broadcast = () => {
    const room = multiplayer.room.state.value;
    if (!room.connected) return;

    const camera = surface.camera.state;

    room.controls.updatePresence({
      productId,
      cursorPosition,
      cameraState: {
        panX: camera.panX.value,
        panY: camera.panY.value,
        zoom: camera.zoom.value,
      },
      draggedElements: host.draggedElements?.() ?? [],
      isAnnotating: annotations?.isActive() ?? false,
    });
  };

  const broadcastFromCursor = (ev: MouseEvent) => {
    cursorPosition = surface.toWorldCoordinates(ev);
    broadcast();
  };

  surface.events.canvas.subscribe('onMouseMove', broadcastFromCursor);
  // a drop that ends without the cursor moving again still has to tell the room the
  // drag is over, since an empty list is the only thing that ends one
  surface.events.dom.subscribe('onMouseUp', broadcastFromCursor);

  // the tools toggle from a keystroke or a button press, neither of which moves the
  // cursor, so nothing else would carry the change out to the room
  annotations?.events.subscribe('onActivated', broadcast);
  annotations?.events.subscribe('onDeactivated', broadcast);
};
