import { ReadonlyEventHub } from '@core/events/createEventHub';

import { onUnmounted } from 'vue';

import {
  ComponentControls,
  useComponent,
} from '../../component-slot/useComponent.ts';
import { ComponentSlotControls } from '../../component-slot/useComponentSlotsState.ts';
import { MultiplayerEventMap } from '../../multiplayer/events.ts';
import JoinSessionBanner from './JoinSessionBanner.vue';

const JOIN_SESSION_SLOT_ID = 'product/multiplayer/join-session-banner';

type JoinSessionBannerOptions = {
  events: ReadonlyEventHub<MultiplayerEventMap>;
  componentSlots: ComponentSlotControls;
};

export const useJoinSessionBanner = ({
  events,
  componentSlots,
}: JoinSessionBannerOptions): ComponentControls => {
  const joinBanner = useComponent(componentSlots, {
    id: JOIN_SESSION_SLOT_ID,
    component: JoinSessionBanner,
    position: 'top-middle',
  });

  events.subscribe('onRoomLeft', joinBanner.hide);

  // the connection outlives the product
  onUnmounted(() => {
    events.unsubscribe('onRoomLeft', joinBanner.hide);
  });

  return joinBanner;
};
