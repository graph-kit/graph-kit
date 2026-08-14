import { onUnmounted } from 'vue';

import { Graph } from '../graph/types.ts';
import { MultiplayerControls } from '../multiplayer/types.ts';
import { ProductId } from '../product/manifests/index.ts';

/** cursor motion is continuous, so it is throttled rather than debounced */
const PRESENCE_INTERVAL = 50;

/**
 * Off the command path, since every tier broadcasts where it is looking. Nothing renders
 * this yet; it is populated so cursors and spectate mode are additive later.
 */
export const usePresenceBroadcast = (
  graph: Graph,
  productId: ProductId,
  multiplayer: MultiplayerControls,
): void => {
  let lastSentAt = 0;

  const send = () => {
    const room = multiplayer.room.value;
    // where someone is looking means nothing outside a room, so this never queues
    if (!room.connected) return;

    const now = Date.now();
    if (now - lastSentAt < PRESENCE_INTERVAL) return;
    lastSentAt = now;

    const camera = graph.canvas.surface.camera.state;
    // world coordinates rather than screen, so a peer at a different pan or zoom can
    // place the cursor against the same graph
    const cursor = graph.canvas.graphUnderCursor.coords;

    room.controls.updatePresence({
      productId,
      cursorPosition: { x: cursor.x, y: cursor.y },
      cameraState: {
        panX: camera.panX.value,
        panY: camera.panY.value,
        zoom: camera.zoom.value,
      },
    });
  };

  const onPointerMove = () => send();

  window.addEventListener('pointermove', onPointerMove);
  onUnmounted(() => window.removeEventListener('pointermove', onPointerMove));
};
