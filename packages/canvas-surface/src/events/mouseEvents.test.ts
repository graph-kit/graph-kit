// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createApp, defineComponent, h, nextTick } from 'vue';

import { useCanvasSurface } from '../index.ts';
import type { ElementEvents } from './index.ts';

// jsdom has no 2d context, and the surface resolves one on mount before anything else runs
HTMLCanvasElement.prototype.getContext = vi.fn(function (this: HTMLCanvasElement) {
  return {
    canvas: this,
    resetTransform: vi.fn(),
    clearRect: vi.fn(),
    setTransform: vi.fn(),
    fillRect: vi.fn(),
    createPattern: vi.fn(),
    drawImage: vi.fn(),
  };
}) as any;

const mounted: (() => void)[] = [];

// the surface keeps a requestAnimationFrame repaint loop alive until it unmounts
afterEach(() => {
  for (const unmount of mounted.splice(0)) unmount();
});

/**
 * the real composable inside a real component tree, because what is under test is the
 * wiring that only exists once mounted: bindings attach on the surface's own onMounted,
 * and the child hands the canvas up through `canvasRef` before that fires
 */
const mountSurface = async () => {
  let surface!: ReturnType<typeof useCanvasSurface>;

  const Child = defineComponent({
    props: { canvasRef: { type: Function, required: true } },
    setup: (props) => () =>
      h('canvas', { ref: (el: any) => el && props.canvasRef(el) }),
  });

  const Parent = defineComponent({
    setup() {
      surface = useCanvasSurface();
      return () => h(Child, { canvasRef: surface.ref.canvasRef });
    },
  });

  const host = document.createElement('div');
  document.body.appendChild(host);
  const app = createApp(Parent);
  app.mount(host);
  mounted.push(() => {
    app.unmount();
    host.remove();
  });
  await nextTick();

  return { surface, canvas: host.querySelector('canvas')! };
};

const MOUSE_EVENTS = [
  ['click', 'onClick'],
  ['mousedown', 'onMouseDown'],
  ['mousemove', 'onMouseMove'],
  ['dblclick', 'onDblClick'],
  ['contextmenu', 'onContextMenu'],
] as const satisfies readonly (readonly [string, keyof ElementEvents])[];

describe('surface mouse events', () => {
  for (const [nativeEvent, eventName] of MOUSE_EVENTS) {
    it(`republishes ${nativeEvent} on the elements hub as ${eventName}`, async () => {
      const { surface, canvas } = await mountSurface();
      const callback = vi.fn();
      surface.events.elements.subscribe(eventName, callback);

      canvas.dispatchEvent(new MouseEvent(nativeEvent, { bubbles: true }));
      expect(callback).toHaveBeenCalledOnce();
    });
  }

  it('republishes a document mouseup, so a drag ending off canvas still finishes', async () => {
    const { surface } = await mountSurface();
    const callback = vi.fn();
    surface.events.elements.subscribe('onMouseUp', callback);

    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    expect(callback).toHaveBeenCalledOnce();
  });

  it('carries the elements under the point the event landed on', async () => {
    const { surface, canvas } = await mountSurface();
    surface.aggregator.getCanvasElementsAtCoordinate = () => [
      { id: 'under-cursor' } as any,
    ];

    const callback = vi.fn();
    surface.events.elements.subscribe('onClick', callback);
    canvas.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({
        topElement: expect.objectContaining({ id: 'under-cursor' }),
      }),
    );
  });
});
