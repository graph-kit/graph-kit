import { describe, expect, it } from 'vitest';

import { generateRoomId, normalizeRoomId } from './room-id.ts';

const neverTaken = () => false;

describe('generateRoomId', () => {
  it('answers a four letter code', () => {
    expect(generateRoomId(neverTaken)).toMatch(/^[A-Z]{4}$/);
  });

  // the same loop is what skips a blocked code, which cannot be forced from outside
  it('draws again until it finds a code nobody holds', () => {
    let draws = 0;
    const isTaken = () => {
      draws++;
      return draws <= 3;
    };

    generateRoomId(isTaken);
    expect(draws).toBe(4);
  });
});

describe('normalizeRoomId', () => {
  it('resolves a code that was typed in lower case', () => {
    expect(normalizeRoomId('jack')).toBe('JACK');
  });
});
