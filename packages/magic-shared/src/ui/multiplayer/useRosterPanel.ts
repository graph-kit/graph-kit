import { ReadonlyEventHub } from '@graph/primitives/events/createEventHub';

import { ComputedRef, computed, onUnmounted } from 'vue';

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
}: RosterPanelOptions): RosterPanelControls => {
  const show = () =>
    componentSlots.add({
      id: ROSTER_PANEL_SLOT_ID,
      component: RosterPanel,
      position: 'center-right',
    });

  const hide = () => componentSlots.remove(ROSTER_PANEL_SLOT_ID);

  const isShown = computed(() =>
    componentSlots.entries.value.some(
      (slot) => slot.id === ROSTER_PANEL_SLOT_ID,
    ),
  );

  const setHighlight = (v: boolean) => {
    if (!isShown.value) return;
    componentSlots.clearHighlighted();
    if (v) componentSlots.setHighlighted(ROSTER_PANEL_SLOT_ID);
  };

  // mounting into a room the connection is already in is a navigation, not a join
  if (room.value.connected) show();

  events.subscribe('onRoomJoined', show);
  events.subscribe('onRoomLeft', hide);

  // the connection outlives the product
  onUnmounted(() => {
    events.unsubscribe('onRoomJoined', show);
    events.unsubscribe('onRoomLeft', hide);
  });

  return {
    show,
    hide,
    isShown,
    setHighlight,
  };
};
