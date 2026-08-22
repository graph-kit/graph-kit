import {
  ClientToServerEvents,
  ServerToClientEvents,
} from '@multiplayer/protocol/events';
import {
  ProductId,
  ProductPresence,
  RoomId,
  RosterEntry,
  UserId,
} from '@multiplayer/protocol/room';
import { Server, Socket } from 'socket.io';

import { Room, RoomStore } from './rooms.ts';

export type SocketServer = Server<ClientToServerEvents, ServerToClientEvents>;
export type MemberSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

/** what a room command aimed at one member needs from that member's own connection */
type MemberConnection = {
  evict: (by: RosterEntry) => void;
  moveTo: (productId: ProductId, by: RosterEntry) => void;
  /** stands up, keeping the socket, so a proven claim can sit down in its place */
  releaseSeat: () => void;
};

/** everything shared by every connection, held for the life of the server */
export type ServerContext = {
  io: SocketServer;
  rooms: RoomStore;
  connections: Map<UserId, MemberConnection>;
};

/** the room, product and member one presence signal belongs to */
type PresenceTarget = {
  room: Room;
  productId: ProductId;
  userId: UserId;
};

export type Relay<Event extends keyof ServerToClientEvents> = Parameters<
  ServerToClientEvents[Event]
>;

/** one socket's place in the room, and who hears what it does */
export type Connection = {
  server: ServerContext;
  socket: MemberSocket;
  /**
   * a getter rather than a value: reclaiming a seat replaces it, and an event registry
   * that read it once at wiring time would spend the rest of the connection answering
   * for somebody who is no longer here
   */
  userId: () => UserId;

  roomId: () => RoomId | null;
  room: () => Room | undefined;
  productId: () => ProductId | null;

  joinRoom: (roomId: RoomId) => void;
  /** takes on a seat proven to belong to this socket, index and all */
  claimSeat: (userId: UserId) => void;
  enterProduct: (productId: ProductId) => void;
  /** clears presence there and says so, which is what releases their drag */
  leaveProduct: (productId: ProductId) => void;
  /** a live socket in no room, which is what both a kick and a leave end at */
  leaveRoomChannels: () => void;

  relayToRoom: <Event extends keyof ServerToClientEvents>(
    event: Event,
    ...args: Relay<Event>
  ) => void;
  relayToProduct: <Event extends keyof ServerToClientEvents>(
    productId: ProductId,
    event: Event,
    ...args: Relay<Event>
  ) => void;
  broadcastRoster: (room: Room) => void;

  /** the room and product a presence signal belongs to, absent for a socket on neither */
  presenceTarget: () => PresenceTarget | undefined;
  /** everyone else on the product, since a client tracks peers and never itself */
  peerPresence: (
    room: Room,
    productId: ProductId,
  ) => Record<UserId, ProductPresence>;

  commander: (room: Room) => RosterEntry | undefined;
};
