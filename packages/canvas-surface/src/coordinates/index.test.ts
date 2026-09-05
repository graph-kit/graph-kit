import { createEventHub } from '@core/events/createEventHub';
import { describe, expect, it } from 'vitest';

import { ref } from 'vue';

import { useWorldCoordinates } from './index.ts';

const setup = () => {
  const camera = { panX: ref(0), panY: ref(0), zoom: ref(1) };
  const canvasEvents = createEventHub({
    onMouseMove: new Set(),
    onMouseDown: new Set(),
    onClick: new Set(),
    onDblClick: new Set(),
    onContextMenu: new Set(),
    onWheel: new Set(),
  } as any);

  const { worldCoordinates, toWorldCoordinates } = useWorldCoordinates(
    camera,
    canvasEvents as any,
  );

  return {
    camera,
    worldCoordinates,
    toWorldCoordinates,
    /** the pointer reporting itself at a point on the canvas, in screen pixels */
    moveTo: (x: number, y: number) =>
      canvasEvents.emit('onMouseMove' as never, { offsetX: x, offsetY: y }),
    /** any other canvas event that carries a position, without a mousemove before it */
    emitAt: (event: string, x: number, y: number) =>
      canvasEvents.emit(event as never, { offsetX: x, offsetY: y }),
  };
};

describe(useWorldCoordinates, () => {
  /*
    the world origin is a real point with real content on it, so seeding one
    would have every consumer believe the pointer is sitting there
  */
  it('has no coordinates until the pointer is seen', () => {
    const { worldCoordinates } = setup();
    expect(worldCoordinates.value).toBeUndefined();
  });

  /*
    the pointer is placed by any event that reports where it is, so someone who
    loads a page and clicks without ever moving is still located
  */
  it.each(['onMouseDown', 'onClick', 'onDblClick', 'onContextMenu', 'onWheel'])(
    'takes the pointer position from %s with no mousemove before it',
    (event) => {
      const { worldCoordinates, emitAt } = setup();
      emitAt(event, 70, 30);
      expect(worldCoordinates.value).toEqual({ x: 70, y: 30 });
    },
  );

  it('undoes the camera to place the pointer in the world', () => {
    const { worldCoordinates, camera, moveTo } = setup();
    camera.panX.value = 100;
    camera.zoom.value = 2;

    moveTo(160, 80);
    expect(worldCoordinates.value).toEqual({ x: 30, y: 40 });
  });

  /*
    the case a cached world point gets wrong: zoom buttons, shortcuts and jumping
    to a peer all move the view under a pointer that never moves itself
  */
  it('follows a camera that moves without the pointer', () => {
    const { worldCoordinates, camera, moveTo } = setup();
    moveTo(100, 100);
    expect(worldCoordinates.value).toEqual({ x: 100, y: 100 });

    camera.zoom.value = 2;
    expect(worldCoordinates.value).toEqual({ x: 50, y: 50 });

    camera.panX.value = 20;
    expect(worldCoordinates.value).toEqual({ x: 40, y: 50 });
  });
});
