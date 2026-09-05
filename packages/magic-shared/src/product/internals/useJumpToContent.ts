import { BoundingBox, Coordinate } from '@core/utils/canvas/index';
import { throttle } from '@core/utils/throttle';

import { ComputedRef, computed, ref } from 'vue';

import { ShellFlags } from '../flags.ts';
import { ProductControls } from '../types.ts';

const CHECK_INTERVAL_MS = 200;

export type JumpToContentControls = {
  /** the product has content and none of it is on screen */
  isContentOffscreen: ComputedRef<boolean>;
  /** centers the camera on the content closest to it */
  jump: () => void;
};

const centerOf = ({ at, width, height }: BoundingBox): Coordinate => ({
  x: at.x + width / 2,
  y: at.y + height / 2,
});

const distanceBetween = (from: Coordinate, to: Coordinate) =>
  Math.hypot(to.x - from.x, to.y - from.y);

export const useJumpToContent = (
  product: Pick<ProductControls, 'surface' | 'isContent'>,
  flags: ShellFlags,
): JumpToContentControls | undefined => {
  const { surface, isContent } = product;
  if (!flags.jumpToContent || !isContent) return;

  const contentOffscreen = ref(false);

  const content = () => surface.aggregator.aggregator().filter(isContent);

  const check = throttle(() => {
    const elements = content();
    const viewport = surface.visibleWorldRect.value;

    contentOffscreen.value =
      elements.length > 0 &&
      !elements.some((element) => element.shape.overlapsBox(viewport));
  }, CHECK_INTERVAL_MS);

  surface.aggregator.events.subscribe('onDraw', check);

  const nearestContent = (to: Coordinate) => {
    let nearest: Coordinate | undefined;
    let nearestDistance = Infinity;

    for (const element of content()) {
      const center = element.shape.getCenterPoint();
      const distance = distanceBetween(to, center);
      if (distance >= nearestDistance) continue;

      nearest = center;
      nearestDistance = distance;
    }

    return nearest;
  };

  const jump = () => {
    const viewport = surface.visibleWorldRect.value;
    const target = nearestContent(centerOf(viewport));
    if (!target) return;

    const { zoom } = surface.camera.state;
    // the viewport is the canvas divided by zoom, so multiplying back gives the css
    // size the pan is measured in
    const canvasWidth = viewport.width * zoom.value;
    const canvasHeight = viewport.height * zoom.value;

    surface.camera.actions.moveTo({
      panX: canvasWidth / 2 - target.x * zoom.value,
      panY: canvasHeight / 2 - target.y * zoom.value,
      zoom: zoom.value,
    });
  };

  return {
    isContentOffscreen: computed(() => contentOffscreen.value),
    jump,
  };
};
