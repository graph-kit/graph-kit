import { createAggregator } from '@canvas/primitives/aggregator/index';
import { CanvasElement } from '@canvas/primitives/aggregator/types';
import { rect } from '@canvas/primitives/shapes/rect/index';
import { useVisibleWorldRect } from '@canvas/surface/coordinates/visibleWorldRect';
import { CanvasSurface } from '@canvas/surface/types';
import { Coordinate } from '@core/utils/canvas/index';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ref } from 'vue';

import { ShellFlags } from '../flags.ts';
import { useJumpToContent } from './useJumpToContent.ts';

const NODE_SIZE = 50;
const CANVAS_SIZE = 1000;

const flags = { jumpToContent: true } as ShellFlags;

const setup = (contentAt: Coordinate[]) => {
  const aggregator = createAggregator({
    beginFrame: () => {},
    endFrame: () => {},
    drawGroup: () => {},
  });

  aggregator.addTransformer((agg) => {
    agg.push(
      ...contentAt.map(
        (at, index) =>
          ({
            id: `content-${index}`,
            priority: 1,
            shape: rect({ at, width: NODE_SIZE, height: NODE_SIZE }),
          }) as CanvasElement,
      ),
    );
    return agg;
  });

  const state = { panX: ref(0), panY: ref(0), zoom: ref(1) };
  const canvasSize = { width: ref(CANVAS_SIZE), height: ref(CANVAS_SIZE) };

  const camera = {
    state,
    actions: {
      moveTo: ({ panX, panY, zoom }: Record<string, number>) => {
        state.panX.value = panX;
        state.panY.value = panY;
        state.zoom.value = zoom;
      },
    },
  };

  const surface = {
    aggregator,
    camera,
    visibleWorldRect: useVisibleWorldRect(state, canvasSize),
  } as unknown as CanvasSurface;

  const controls = useJumpToContent(
    { surface, isContent: ({ id }) => id.startsWith('content-') },
    flags,
  );

  // the aggregator is rebuilt by the draw the check rides
  const paint = () => {
    vi.advanceTimersByTime(1000);
    aggregator.draw({} as CanvasRenderingContext2D);
  };

  return { controls, camera, surface, paint };
};

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('useJumpToContent', () => {
  it('stays away when the product names no content', () => {
    const surface = {} as unknown as CanvasSurface;
    expect(useJumpToContent({ surface }, flags)).toBeUndefined();
  });

  it('stays away when the product flagged it off', () => {
    const surface = {} as unknown as CanvasSurface;
    const controls = useJumpToContent({ surface, isContent: () => true }, {
      jumpToContent: false,
    } as ShellFlags);

    expect(controls).toBeUndefined();
  });

  it('reports nothing offscreen on an empty canvas', () => {
    const { controls, paint } = setup([]);
    paint();

    expect(controls?.isContentOffscreen.value).toBe(false);
  });

  it('reports nothing offscreen while content is in view', () => {
    const { controls, paint } = setup([{ x: 100, y: 100 }]);
    paint();

    expect(controls?.isContentOffscreen.value).toBe(false);
  });

  it('reports content offscreen once the camera leaves it behind', () => {
    const { controls, camera, paint } = setup([{ x: 100, y: 100 }]);
    camera.actions.moveTo({ panX: -50_000, panY: -50_000, zoom: 1 });
    paint();

    expect(controls?.isContentOffscreen.value).toBe(true);
  });

  it('takes the camera back to content it can see', () => {
    const { controls, camera, paint } = setup([{ x: 100, y: 100 }]);
    camera.actions.moveTo({ panX: -50_000, panY: -50_000, zoom: 1 });
    paint();

    controls?.jump();
    paint();

    expect(controls?.isContentOffscreen.value).toBe(false);
  });

  it('leaves the zoom it was handed alone', () => {
    const { controls, camera, paint } = setup([{ x: 100, y: 100 }]);
    camera.actions.moveTo({ panX: -50_000, panY: -50_000, zoom: 2.5 });
    paint();

    controls?.jump();

    expect(camera.state.zoom.value).toBe(2.5);
  });

  it('centers the screen on the content it jumped to', () => {
    const { controls, camera, surface, paint } = setup([{ x: 100, y: 100 }]);
    camera.actions.moveTo({ panX: -50_000, panY: -50_000, zoom: 1 });
    paint();

    controls?.jump();

    const { at, width, height } = surface.visibleWorldRect.value;
    expect(at.x + width / 2).toBeCloseTo(100 + NODE_SIZE / 2);
    expect(at.y + height / 2).toBeCloseTo(100 + NODE_SIZE / 2);
  });

  it('picks the closest content rather than the middle of all of it', () => {
    const near = { x: 10_000, y: 0 };
    const { controls, camera, surface, paint } = setup([
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      near,
    ]);

    camera.actions.moveTo({ panX: -12_000, panY: 0, zoom: 1 });
    paint();

    controls?.jump();

    const { at, width } = surface.visibleWorldRect.value;
    expect(at.x + width / 2).toBeCloseTo(near.x + NODE_SIZE / 2);
  });
});
