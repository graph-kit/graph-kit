import { onUnmounted } from 'vue';

import { Graph } from '../graph/types.ts';
import { MultiplayerControls } from '../multiplayer/createMultiplayer.ts';
import { ProductId } from '../product/manifests/index.ts';

/** cursor motion is continuous, so it is throttled rather than debounced */
const PRESENCE_INTERVAL = 50;

/**
 * Off the command path: every tier broadcasts, and suspension does not apply, since it
 * gates product state rather than where someone is looking. Nothing renders this yet;
 * it is populated so cursors and spectate mode are additive later.
 */
export const usePresenceBroadcast = (
  graph: Graph,
  productId: ProductId,
  multiplayer: MultiplayerControls,
): void => {
  let lastSentAt = 0;

  const send = () => {
    const now = Date.now();
    if (now - lastSentAt < PRESENCE_INTERVAL) return;
    lastSentAt = now;

    const camera = graph.canvas.surface.camera.state;
    // world coordinates rather than screen, so a peer at a different pan or zoom can
    // place the cursor against the same graph
    const cursor = graph.canvas.graphUnderCursor.coords;

    multiplayer.updatePresence({
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
