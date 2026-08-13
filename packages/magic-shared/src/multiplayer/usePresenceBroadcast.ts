import { onUnmounted } from 'vue';

import { Graph } from '../graph/types.ts';
import { ProductId } from '../product/manifests/index.ts';
import { MultiplayerControls } from './createMultiplayer.ts';

/** cursor motion is continuous, so it is throttled rather than debounced */
const PRESENCE_INTERVAL = 50;

/**
 * Presence is deliberately off the command path: every tier broadcasts it, including
 * read, and it is never gated by privilege or by suspension. Suspension gates the
 * product's state; where a user's attention is keeps updating regardless.
 *
 * cameraState and cursorPosition have no consumer yet. They are populated now so cursor
 * indicators and spectate mode are additive later rather than new wiring.
 */
export const usePresenceBroadcast = (
  graph: Graph,
  productId: ProductId,
  multiplayer: MultiplayerControls,
) => {
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
