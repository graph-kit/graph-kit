import {
  type ReadonlyEventHub,
  createEventHub,
} from '@core/events/createEventHub';
import type { EventMapToEventRegistry } from '@core/events/types';

import { type Ref, watch } from 'vue';

/** where the camera sits, as plain numbers rather than the refs behind them */
export type CameraState = {
  panX: number;
  panY: number;
  zoom: number;
};

export type CameraEvents = {
  onPanX: (panX: number, previousPanX: number) => void;
  onPanY: (panY: number, previousPanY: number) => void;
  onZoom: (zoom: number, previousZoom: number) => void;
  /**
   * the camera moved, whichever part of it did. a single maneuver reports here
   * once, even though zooming toward the cursor pans and zooms at the same time.
   */
  onCameraChange: (state: CameraState, previousState: CameraState) => void;
};

const createCameraEventRegistry =
  (): EventMapToEventRegistry<CameraEvents> => ({
    onPanX: new Set(),
    onPanY: new Set(),
    onZoom: new Set(),
    onCameraChange: new Set(),
  });

type CameraRefs = { [Field in keyof CameraState]: Ref<CameraState[Field]> };

export const createCameraEvents = (
  camera: CameraRefs,
): ReadonlyEventHub<CameraEvents> => {
  const events = createEventHub(createCameraEventRegistry());

  /*
    watched rather than emitted from each maneuver because the pan and zoom refs
    are writable by anyone holding the camera, and a viewport written straight
    onto them has to report like any other move. batching is what makes
    onCameraChange one event: the three refs a zoom writes settle before it runs.
  */
  watch(
    [camera.panX, camera.panY, camera.zoom],
    ([panX, panY, zoom], [previousPanX, previousPanY, previousZoom]) => {
      if (panX !== previousPanX) events.emit('onPanX', panX, previousPanX);
      if (panY !== previousPanY) events.emit('onPanY', panY, previousPanY);
      if (zoom !== previousZoom) events.emit('onZoom', zoom, previousZoom);
      events.emit(
        'onCameraChange',
        { panX, panY, zoom },
        { panX: previousPanX, panY: previousPanY, zoom: previousZoom },
      );
    },
  );

  return events;
};
