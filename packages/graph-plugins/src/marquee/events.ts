import { BoundingBox } from '@canvas/primitives/types/utility';
import { Coordinate } from '@canvas/surface/types';
import { EventMapToEventRegistry } from '@core/events/types';

export type MarqueeEventMap = {
  /**
   * when the user starts a marquee selection
   */
  onMarqueeBeginSelection: (startingCoords: Readonly<Coordinate>) => void;
  /**
   * when the user ends a marquee selection
   */
  onMarqueeEndSelection: (marqueeBox: Readonly<BoundingBox>) => void;
};

type MarqueeEventRegistry = EventMapToEventRegistry<MarqueeEventMap>;

export const createMarqueeEventRegistry = (): MarqueeEventRegistry => ({
  onMarqueeBeginSelection: new Set(),
  onMarqueeEndSelection: new Set(),
});
