import { EventMapToEventRegistry } from '@graph/primitives/events/types';
import { RosterEntry } from '@multiplayer/protocol/room';

export type MultiplayerEventMap = {
  /** triggered once membership is in hand, whether the room was opened or joined */
  onRoomJoined: () => void;
  /** triggered on leaving, being kicked, and the room disbanding alike */
  onRoomLeft: () => void;
  /**
   * the one departure nobody chose, and the only one worth saying out loud. carries who
   * did it, which the roster cannot answer afterwards since the room is already gone
   */
  onKicked: (kickedBy: RosterEntry) => void;
  /** bracket the wait for room state that is mid flight */
  onPendingStarted: () => void;
  onPendingEnded: () => void;
};

type MultiplayerEventRegistry = EventMapToEventRegistry<MultiplayerEventMap>;

export const createMultiplayerEventRegistry = (): MultiplayerEventRegistry => ({
  onRoomJoined: new Set(),
  onRoomLeft: new Set(),
  onKicked: new Set(),
  onPendingStarted: new Set(),
  onPendingEnded: new Set(),
});
