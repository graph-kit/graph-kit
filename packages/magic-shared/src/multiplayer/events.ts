import { EventMapToEventRegistry } from '@core/events/types';
import { DisbandReason } from '@multiplayer/protocol/events';
import {
  CameraState,
  DraggedElement,
  Point,
  RosterEntry,
  UserId,
} from '@multiplayer/protocol/room';

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
  /**
   * the room itself ended, which nobody in it chose. carries why, since a host closing
   * the session and a room timing out around people who are still sitting in it read as
   * completely different things to the person it happens to
   */
  onRoomDisbanded: (reason: DisbandReason) => void;
  /** bracket the wait for room state that is mid flight */
  onPendingStarted: () => void;
  onPendingEnded: () => void;

  /**
   * Presence, one event per signal, scoped to the product on screen. Everything here is
   * about a peer: this client never hears its own signals back, so a subscriber never
   * has to filter itself out.
   */
  onPeerCursorMoved: (userId: UserId, position: Point | null) => void;
  onPeerCameraMoved: (userId: UserId, camera: CameraState) => void;
  onPeerAnnotatingChanged: (userId: UserId, isAnnotating: boolean) => void;

  /**
   * A peer's drag, as it happens. Start can arrive twice for one gesture with an end
   * between them, when the room released a drag early and its owner revived it, so
   * subscribers must set and clear by user rather than assume a matched pair.
   */
  onPeerDragStarted: (userId: UserId, elements: DraggedElement[]) => void;
  onPeerDragMoved: (userId: UserId, elements: DraggedElement[]) => void;
  onPeerDragEnded: (userId: UserId) => void;

  /** a peer is on the product, before they have done anything on it */
  onPeerEnteredProduct: (userId: UserId) => void;
  /** a peer is off the product entirely, whether they navigated, dropped or were kicked */
  onPeerLeftProduct: (userId: UserId) => void;

  /** the product's live presence landed as a whole, on arrival */
  onPresenceSeeded: () => void;
};

type MultiplayerEventRegistry = EventMapToEventRegistry<MultiplayerEventMap>;

export const createMultiplayerEventRegistry = (): MultiplayerEventRegistry => ({
  onRoomJoined: new Set(),
  onRoomLeft: new Set(),
  onKicked: new Set(),
  onRoomDisbanded: new Set(),
  onPendingStarted: new Set(),
  onPendingEnded: new Set(),
  onPeerCursorMoved: new Set(),
  onPeerCameraMoved: new Set(),
  onPeerAnnotatingChanged: new Set(),
  onPeerDragStarted: new Set(),
  onPeerDragMoved: new Set(),
  onPeerDragEnded: new Set(),
  onPeerEnteredProduct: new Set(),
  onPeerLeftProduct: new Set(),
  onPresenceSeeded: new Set(),
});
