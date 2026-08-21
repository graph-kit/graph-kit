import {
  DocStateVector,
  DocUpdate,
  toDocUpdate,
} from '@multiplayer/protocol/doc';
import { ProductId } from '@multiplayer/protocol/room';
import * as Y from 'yjs';

import { Room, productIn } from './rooms.ts';

/** the whole document, for a joiner who has nothing yet. null before anyone seeds it */
export const encodeProductDoc = (
  room: Room,
  productId: ProductId,
): DocUpdate | null => {
  const product = room.products[productId];
  if (!product) return null;
  return Y.encodeStateAsUpdate(product.doc);
};

/** only what the client is missing, which is what makes a reconnect cheap */
export const encodeProductDocDiff = (
  room: Room,
  productId: ProductId,
  stateVector: DocStateVector,
): DocUpdate | null => {
  const product = room.products[productId];
  if (!product) return null;
  return Y.encodeStateAsUpdate(product.doc, toDocUpdate(stateVector));
};

/**
 * Merged blindly: the server never inspects what an update contains, which is what keeps
 * it agnostic to what any product stores. Creates the document on first write, so a
 * product nobody has opened yet costs nothing.
 */
export const applyProductDocUpdate = (
  room: Room,
  productId: ProductId,
  update: DocUpdate,
): void => {
  Y.applyUpdate(productIn(room, productId).doc, toDocUpdate(update));
};
