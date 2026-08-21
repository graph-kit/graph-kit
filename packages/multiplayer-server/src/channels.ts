import { ProductId, RoomId } from '@multiplayer/protocol/room';

/**
 * document and presence go to the people on that product rather than the whole room.
 * derived from the roster the server already keeps, so clients manage no subscription
 */
export const productChannel = (roomId: RoomId, productId: ProductId): string =>
  `${roomId}:${productId}`;
