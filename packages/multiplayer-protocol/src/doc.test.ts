import { describe, expect, it } from 'vitest';
import * as Y from 'yjs';

import { toDocUpdate } from './doc.ts';

const update = () => {
  const doc = new Y.Doc();
  doc.getMap('nodes').set('a', { x: 1 });
  return Y.encodeStateAsUpdate(doc);
};

/** what socket.io's default parser reconstructs binary as in a browser */
const asArrayBuffer = (bytes: Uint8Array): ArrayBuffer => {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
};

const readNodes = (payload: Uint8Array) => {
  const doc = new Y.Doc();
  Y.applyUpdate(doc, payload);
  return doc.getMap('nodes').toJSON();
};

describe(toDocUpdate, () => {
  it('passes a Uint8Array through untouched', () => {
    const bytes = update();

    expect(toDocUpdate(bytes)).toBe(bytes);
  });

  // the case a node client never produces, and the one that broke joining a room
  it('makes an ArrayBuffer readable, which Yjs refuses on its own', () => {
    const bytes = update();
    const overTheWire = asArrayBuffer(bytes);

    expect(() => Y.applyUpdate(new Y.Doc(), overTheWire as never)).toThrow();
    expect(readNodes(toDocUpdate(overTheWire))).toEqual({ a: { x: 1 } });
  });
});
