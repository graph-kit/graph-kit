import { ReadonlyEventHub } from '@core/events/createEventHub';

import { ComputedRef, computed, onUnmounted } from 'vue';

import {
  ComponentControls,
  useComponent,
} from '../../component-slot/useComponent.ts';
import { ComponentSlotControls } from '../../component-slot/useComponentSlotsState.ts';
import { MultiplayerEventMap } from '../../multiplayer/events.ts';
import { RoomState } from '../../multiplayer/types.ts';
import RosterPanel from './RosterPanel.vue';

const ROSTER_PANEL_SLOT_ID = 'product/roster-panel';

export type RosterPanelControls = {
  show: () => void;
  hide: () => void;
  setHighlight: (v: boolean) => void;
  isShown: ComputedRef<boolean>;
};

type RosterPanelOptions = {
  room: ComputedRef<RoomState>;
  events: ReadonlyEventHub<MultiplayerEventMap>;
  componentSlots: ComponentSlotControls;
};

export const useRosterPanel = ({
  room,
  events,
  componentSlots,
}: RosterPanelOptions): ComponentControls => {
  const roster = useComponent(componentSlots, {
    id: ROSTER_PANEL_SLOT_ID,
    component: RosterPanel,
    position: 'center-right',
  });

  // mounting into a room the connection is already in is a navigation, not a join
  if (room.value.connected) roster.show();

  events.subscribe('onRoomJoined', roster.show);
  events.subscribe('onRoomLeft', roster.hide);

  // the connection outlives the product
  onUnmounted(() => {
    events.unsubscribe('onRoomJoined', roster.show);
    events.unsubscribe('onRoomLeft', roster.hide);
  });

  return roster;
};
