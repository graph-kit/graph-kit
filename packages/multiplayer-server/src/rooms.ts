import { DocUpdate, toDocUpdate } from '@multiplayer/protocol/doc';
import {
  ProductId,
  ProductPresence,
  RoomData,
  RoomId,
  UserId,
} from '@multiplayer/protocol/room';
import * as Y from 'yjs';

/** presence sits here rather than on the room: it means nothing off this product */
export type ProductRoom = {
  doc: Y.Doc;
  presence: Record<UserId, ProductPresence>;
  /** server only, never on the wire */
  dragTouchedAt: Record<UserId, number>;
};

export type Room = {
  data: RoomData;
  products: Record<ProductId, ProductRoom>;
};

const createProductRoom = (doc: Y.Doc): ProductRoom => ({
  doc,
  presence: {},
  dragTouchedAt: {},
});

/** created on first reach, so a product nobody has opened yet costs nothing */
export const productIn = (room: Room, productId: ProductId): ProductRoom =>
  (room.products[productId] ??= createProductRoom(new Y.Doc()));

export const createRoom = (options: {
  hostId: UserId;
  displayName: string;
  productId: ProductId;
  doc: DocUpdate;
}): Room => ({
  data: {
    hostId: options.hostId,
    roster: {
      [options.hostId]: {
        userId: options.hostId,
        displayName: options.displayName,
        tier: 'host',
        productId: options.productId,
      },
    },
  },
  // only the host's product is seeded; the rest are created on first reach
  products: {
    [options.productId]: createProductRoom(docFromUpdate(options.doc)),
  },
});

const docFromUpdate = (update: DocUpdate): Y.Doc => {
  const doc = new Y.Doc();
  Y.applyUpdate(doc, toDocUpdate(update));
  return doc;
};

/** every live room, held in memory: a redeploy drops all of them, by design */
export type RoomStore = {
  get: (roomId: RoomId) => Room | undefined;
  set: (roomId: RoomId, room: Room) => void;
  delete: (roomId: RoomId) => void;
  has: (roomId: RoomId) => boolean;
  /** only the drag sweep has a use for this */
  entries: () => [RoomId, Room][];
};

export const createRoomStore = (): RoomStore => {
  const roomIdToRoom = new Map<RoomId, Room>();

  return {
    get: (roomId) => roomIdToRoom.get(roomId),
    set: (roomId, room) => {
      roomIdToRoom.set(roomId, room);
    },
    delete: (roomId) => {
      roomIdToRoom.delete(roomId);
    },
    has: (roomId) => roomIdToRoom.has(roomId),
    entries: () => [...roomIdToRoom.entries()],
  };
};
