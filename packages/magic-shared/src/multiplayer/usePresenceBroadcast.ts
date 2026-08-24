import { CanvasSurface } from '@canvas/surface/types';
import { AnnotationsControls } from '@core/annotations/index';

import { watch } from 'vue';

import { MultiplayerControls } from '../product/types.ts';
import { ProductMultiplayer } from './types.ts';

/**
 * Sends what this user is doing, one signal at a time. Each has its own trigger, so a
 * drag no longer rides out alongside whatever the cursor happens to be doing, and a
 * signal nothing changed about is never resent.
 */
export const usePresenceBroadcast = (options: {
  surface: CanvasSurface;
  multiplayer: ProductMultiplayer;
  host: MultiplayerControls;
  annotations?: AnnotationsControls;
}) => {
  const { surface, multiplayer, host, annotations } = options;

  const presence = () => {
    const room = multiplayer.room.state.value;
    if (!room.connected) return;
    return room.controls.presence;
  };

  surface.events.canvas.subscribe('onMouseMove', (event) => {
    presence()?.moveCursor(surface.toWorldCoordinates(event));
  });

  const camera = surface.camera.state;
  watch(
    () => [camera.panX.value, camera.panY.value, camera.zoom.value],
    () =>
      presence()?.moveCamera({
        panX: camera.panX.value,
        panY: camera.panY.value,
        zoom: camera.zoom.value,
      }),
  );

  // the tools toggle from a keystroke or a button press, neither of which moves the
  // cursor, so nothing else would carry the change out to the room
  annotations?.events.subscribe('onActivated', () =>
    presence()?.setAnnotating(true),
  );
  annotations?.events.subscribe('onDeactivated', () =>
    presence()?.setAnnotating(false),
  );

  // the stroke channel rather than the document, for the same reason a drag has one: a
  // drawing settles into one committed annotation, and a laser settles into nothing, so
  // waiting for the commit would show peers a stroke late and a laser never
  annotations?.events.subscribe('onStrokeBegan', (stroke) =>
    presence()?.startStroke({ ...stroke, points: [...stroke.points] }),
  );
  annotations?.events.subscribe('onStrokeExtended', (points) =>
    presence()?.extendStroke([...points]),
  );
  annotations?.events.subscribe('onStrokeEnded', () => presence()?.endStroke());

  host.drag?.subscribe('onDragStarted', (elements) =>
    presence()?.startDrag(elements),
  );
  host.drag?.subscribe('onDragMoved', (elements) =>
    presence()?.updateDrag(elements),
  );
  host.drag?.subscribe('onDragEnded', () => presence()?.endDrag());
};
