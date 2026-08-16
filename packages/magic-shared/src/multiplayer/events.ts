import { EventMapToEventRegistry } from '@graph/primitives/events/types';

export type MultiplayerEventMap = {
  /** triggered once membership is in hand, whether the room was opened or joined */
  onRoomJoined: () => void;
  /** triggered on leaving, being kicked, and the room disbanding alike */
  onRoomLeft: () => void;
};

type MultiplayerEventRegistry = EventMapToEventRegistry<MultiplayerEventMap>;

export const createMultiplayerEventRegistry = (): MultiplayerEventRegistry => ({
  onRoomJoined: new Set(),
  onRoomLeft: new Set(),
});
