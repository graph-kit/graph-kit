import {
  DraggedElement,
  PeerStroke,
  Point,
  ProductId,
  ProductPresence,
  UserId,
  emptyProductPresence,
} from '@multiplayer/protocol/room';
import { appendStrokePoints } from '@multiplayer/protocol/stroke';

import { Room, productIn } from './rooms.ts';

export const presenceIn = (
  room: Room,
  productId: ProductId,
): Record<UserId, ProductPresence> => room.products[productId]?.presence ?? {};

/** without this a member who arrives and sits still looks like one who is not here */
export const ensurePresence = (
  room: Room,
  productId: ProductId,
  userId: UserId,
): ProductPresence =>
  (productIn(room, productId).presence[userId] ??= emptyProductPresence());

/** partial because each signal owns one field and leaves the rest alone */
export const setPresence = (
  room: Room,
  productId: ProductId,
  userId: UserId,
  patch: Partial<ProductPresence>,
): void => {
  const product = productIn(room, productId);
  const entry = (product.presence[userId] ??= emptyProductPresence());
  Object.assign(entry, patch);
};

export const setDrag = (
  room: Room,
  productId: ProductId,
  userId: UserId,
  elements: DraggedElement[],
  now: number,
): void => {
  setPresence(room, productId, userId, { drag: elements });
  productIn(room, productId).dragTouchedAt[userId] = now;
};

export const clearDrag = (
  room: Room,
  productId: ProductId,
  userId: UserId,
): void => {
  const product = room.products[productId];
  if (!product) return;
  const entry = product.presence[userId];
  if (entry) entry.drag = null;
  delete product.dragTouchedAt[userId];
};

/**
 * @returns the stroke as the room kept it, which is what peers are sent: the cap belongs
 * on the way in, or an opening payload would carry a length no later delta could reach.
 */
export const setStroke = (
  room: Room,
  productId: ProductId,
  userId: UserId,
  stroke: PeerStroke,
): PeerStroke => {
  const kept: PeerStroke = { ...stroke, points: [] };
  appendStrokePoints(kept, stroke.points);

  setPresence(room, productId, userId, { stroke: kept });
  return kept;
};

/**
 * @returns whether there was a stroke to extend. a delta for a stroke the room has no
 * record of is dropped rather than promoted to a start the way a drag move is: there is no
 * id, colour or weight in a delta to revive one with, and the next stroke starts clean
 */
export const extendStroke = (
  room: Room,
  productId: ProductId,
  userId: UserId,
  points: Point[],
): boolean => {
  const stroke = room.products[productId]?.presence[userId]?.stroke;
  if (!stroke) return false;

  appendStrokePoints(stroke, points);
  return true;
};

export const clearStroke = (
  room: Room,
  productId: ProductId,
  userId: UserId,
): void => {
  const product = room.products[productId];
  if (!product) return;
  const entry = product.presence[userId];
  if (entry) entry.stroke = null;
};

/** what separates a move continuing a gesture from one that has to revive it */
export const hasDrag = (
  room: Room,
  productId: ProductId,
  userId: UserId,
): boolean => room.products[productId]?.presence[userId]?.drag != null;

export const clearPresence = (
  room: Room,
  productId: ProductId,
  userId: UserId,
): void => {
  const product = room.products[productId];
  if (!product) return;
  delete product.presence[userId];
  delete product.dragTouchedAt[userId];
};

export type ExpiredDrag = { productId: ProductId; userId: UserId };

/** @returns what it released, since each has to be announced on its own product */
export const expireStaleDrags = (
  room: Room,
  now: number,
  staleAfterMs: number,
): ExpiredDrag[] => {
  const expired: ExpiredDrag[] = [];
  for (const [productId, product] of Object.entries(room.products)) {
    for (const [userId, touchedAt] of Object.entries(product.dragTouchedAt)) {
      if (now - touchedAt <= staleAfterMs) continue;
      clearDrag(room, productId, userId);
      expired.push({ productId, userId });
    }
  }
  return expired;
};
