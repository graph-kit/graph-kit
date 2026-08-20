import { CanvasSurface } from '@canvas/surface/types';
import { ReadonlyEventHub } from '@core/events/createEventHub';

import { onUnmounted } from 'vue';

import { MultiplayerEventMap } from './events.ts';

type SuspendedContentOptions = {
  surface: CanvasSurface;
  events: ReadonlyEventHub<MultiplayerEventMap>;
};

/** the room's copy is on its way, so the canvas holds blank rather than showing state a moment from being replaced */
export const useSuspendedContent = ({
  surface,
  events,
}: SuspendedContentOptions) => {
  const suspend = () => (surface.draw.contentSuspended.value = true);
  const resume = () => (surface.draw.contentSuspended.value = false);

  events.subscribe('onPendingStarted', suspend);
  events.subscribe('onPendingEnded', resume);

  onUnmounted(() => {
    events.unsubscribe('onPendingStarted', suspend);
    events.unsubscribe('onPendingEnded', resume);
  });
};
