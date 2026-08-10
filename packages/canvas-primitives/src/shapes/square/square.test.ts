import { describe, expect, it, vi } from 'vitest';

import { SQUARE_SCHEMA_DEFAULTS } from './defaults.ts';
import { square } from './index.ts';

vi.mock('@core/utils/canvas/index', () => ({
  getClientCoordinates: vi.fn(),
  getCtx: vi.fn(() => ({
    measureText: vi.fn(() => ({
      width: 0,
      actualBoundingBoxAscent: 0,
      actualBoundingBoxDescent: 0,
    })),
    textAlign: '',
    textBaseline: '',
    font: '',
    fillStyle: '',
    fillText: vi.fn(),
  })),
}));

describe('square', () => {
  describe('defaults', () => {
    it('has name "square"', () => {
      const s = square({ at: { x: 0, y: 0 }, size: 100 });
      expect(s.name).toBe('square');
    });

    it('defaults fillColor to "black"', () => {
      expect(SQUARE_SCHEMA_DEFAULTS.fillColor).toBe('black');
    });

    it('defaults borderRadius to 0', () => {
      expect(SQUARE_SCHEMA_DEFAULTS.borderRadius).toBe(0);
    });

    it('defaults rotation to 0', () => {
      expect(SQUARE_SCHEMA_DEFAULTS.rotation).toBe(0);
    });

    it('maps size to equal width and height in the bounding box', () => {
      const s = square({ at: { x: 0, y: 0 }, size: 75 });
      const bbox = s.getBoundingBox();
      expect(bbox.width).toBe(75);
      expect(bbox.height).toBe(75);
    });

    it('preserves the anchor point in the bounding box', () => {
      const s = square({ at: { x: 30, y: 40 }, size: 50 });
      const bbox = s.getBoundingBox();
      expect(bbox.at.x).toBe(30);
      expect(bbox.at.y).toBe(40);
    });
  });

  describe('hitbox', () => {
    const s = square({ at: { x: 0, y: 0 }, size: 100 });

    describe('points inside', () => {
      it('hits the center', () => {
        expect(s.hitbox({ x: 50, y: 50 })).toBe(true);
      });

      it('hits a point near the top-left', () => {
        expect(s.hitbox({ x: 1, y: 1 })).toBe(true);
      });

      it('hits a point near the bottom-right', () => {
        expect(s.hitbox({ x: 99, y: 99 })).toBe(true);
      });

      it('hits edge midpoints', () => {
        expect(s.hitbox({ x: 50, y: 0 })).toBe(true);
        expect(s.hitbox({ x: 50, y: 100 })).toBe(true);
        expect(s.hitbox({ x: 0, y: 50 })).toBe(true);
        expect(s.hitbox({ x: 100, y: 50 })).toBe(true);
      });

      it('hits all four corners with default borderRadius (0)', () => {
        expect(s.hitbox({ x: 0, y: 0 })).toBe(true);
        expect(s.hitbox({ x: 100, y: 0 })).toBe(true);
        expect(s.hitbox({ x: 0, y: 100 })).toBe(true);
        expect(s.hitbox({ x: 100, y: 100 })).toBe(true);
      });
    });

    describe('points outside', () => {
      it('misses a point just beyond the left edge', () => {
        expect(s.hitbox({ x: -1, y: 50 })).toBe(false);
      });

      it('misses a point just beyond the right edge', () => {
        expect(s.hitbox({ x: 101, y: 50 })).toBe(false);
      });

      it('misses a point just above the top edge', () => {
        expect(s.hitbox({ x: 50, y: -1 })).toBe(false);
      });

      it('misses a point just below the bottom edge', () => {
        expect(s.hitbox({ x: 50, y: 101 })).toBe(false);
      });

      it('misses a point far outside', () => {
        expect(s.hitbox({ x: 500, y: 500 })).toBe(false);
      });
    });

    describe('with offset position', () => {
      const offset = square({ at: { x: 200, y: 300 }, size: 50 });

      it('hits the center of the offset square', () => {
        expect(offset.hitbox({ x: 225, y: 325 })).toBe(true);
      });

      it('misses the origin when the square is offset', () => {
        expect(offset.hitbox({ x: 0, y: 0 })).toBe(false);
      });

      it('misses a point just outside the offset square', () => {
        expect(offset.hitbox({ x: 199, y: 325 })).toBe(false);
        expect(offset.hitbox({ x: 251, y: 325 })).toBe(false);
      });
    });

    describe('corner behavior reflects borderRadius default', () => {
      it('includes corners when no borderRadius is set (default 0)', () => {
        const noRadius = square({ at: { x: 0, y: 0 }, size: 100 });
        expect(noRadius.hitbox({ x: 0, y: 0 })).toBe(true);
      });

      it('excludes corners when borderRadius is explicitly rounded', () => {
        const rounded = square({
          at: { x: 0, y: 0 },
          size: 100,
          borderRadius: 50,
        });
        expect(rounded.hitbox({ x: 0, y: 0 })).toBe(false);
      });
    });
  });
});
