import { nullThrows } from '@core/utils/assert';
import { describe, expect, it, vi } from 'vitest';

import { effectScope, nextTick, ref } from 'vue';

import { createCameraEvents } from './events.ts';

const setup = () => {
  const camera = { panX: ref(0), panY: ref(0), zoom: ref(1) };
  const scope = effectScope();
  const events = nullThrows(
    scope.run(() => createCameraEvents(camera)),
    'effect scope ran without producing a camera event hub',
  );
  return { camera, events };
};

describe('camera events', () => {
  it('reports the axis that moved and leaves the others quiet', async () => {
    const { camera, events } = setup();
    const onPanX = vi.fn();
    const onPanY = vi.fn();
    const onZoom = vi.fn();
    events.subscribe('onPanX', onPanX);
    events.subscribe('onPanY', onPanY);
    events.subscribe('onZoom', onZoom);

    camera.panX.value = 40;
    await nextTick();

    expect(onPanX).toHaveBeenCalledExactlyOnceWith(40, 0);
    expect(onPanY).not.toHaveBeenCalled();
    expect(onZoom).not.toHaveBeenCalled();
  });

  /*
    the case the batching exists for: zooming toward the cursor writes all three
    refs, and that is one camera move, not three
  */
  it('reports a pan and zoom written together as a single change', async () => {
    const { camera, events } = setup();
    const onCameraChange = vi.fn();
    events.subscribe('onCameraChange', onCameraChange);

    camera.panX.value = 10;
    camera.panY.value = 20;
    camera.zoom.value = 2;
    await nextTick();

    expect(onCameraChange).toHaveBeenCalledExactlyOnceWith(
      { panX: 10, panY: 20, zoom: 2 },
      { panX: 0, panY: 0, zoom: 1 },
    );
  });

  it('stays quiet when a write lands on the value already there', async () => {
    const { camera, events } = setup();
    const onCameraChange = vi.fn();
    events.subscribe('onCameraChange', onCameraChange);

    camera.zoom.value = 1;
    await nextTick();

    expect(onCameraChange).not.toHaveBeenCalled();
  });
});
