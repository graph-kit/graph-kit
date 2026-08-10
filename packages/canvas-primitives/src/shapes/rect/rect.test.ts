import { describe, expect, it, vi } from 'vitest';

import { RECT_SCHEMA_DEFAULTS } from './defaults.ts';
import { rect } from './index.ts';

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

describe('rect', () => {
  describe('defaults', () => {
    it('has name "rect"', () => {
      const r = rect({ at: { x: 0, y: 0 }, width: 100, height: 50 });
      expect(r.name).toBe('rect');
    });

    it('defaults fillColor to "black"', () => {
      expect(RECT_SCHEMA_DEFAULTS.fillColor).toBe('black');
    });

    it('defaults borderRadius to 0', () => {
      expect(RECT_SCHEMA_DEFAULTS.borderRadius).toBe(0);
    });

    it('defaults rotation to 0', () => {
      expect(RECT_SCHEMA_DEFAULTS.rotation).toBe(0);
    });

    it('returns the correct bounding box size', () => {
      const r = rect({ at: { x: 0, y: 0 }, width: 120, height: 60 });
      const bbox = r.getBoundingBox();
      expect(bbox.width).toBe(120);
      expect(bbox.height).toBe(60);
    });

    it('preserves the anchor point in the bounding box', () => {
      const r = rect({ at: { x: 30, y: 40 }, width: 100, height: 50 });
      const bbox = r.getBoundingBox();
      expect(bbox.at.x).toBe(30);
      expect(bbox.at.y).toBe(40);
    });
  });

  describe('hitbox', () => {
    describe('axis-aligned with no border radius', () => {
      const r = rect({ at: { x: 0, y: 0 }, width: 100, height: 50 });

      it('hits the center', () => {
        expect(r.hitbox({ x: 50, y: 25 })).toBe(true);
      });

      it('hits all four corners', () => {
        expect(r.hitbox({ x: 0, y: 0 })).toBe(true);
        expect(r.hitbox({ x: 100, y: 0 })).toBe(true);
        expect(r.hitbox({ x: 0, y: 50 })).toBe(true);
        expect(r.hitbox({ x: 100, y: 50 })).toBe(true);
      });

      it('hits edge midpoints', () => {
        expect(r.hitbox({ x: 50, y: 0 })).toBe(true);
        expect(r.hitbox({ x: 50, y: 50 })).toBe(true);
        expect(r.hitbox({ x: 0, y: 25 })).toBe(true);
        expect(r.hitbox({ x: 100, y: 25 })).toBe(true);
      });

      it('misses a point just beyond each edge', () => {
        expect(r.hitbox({ x: -1, y: 25 })).toBe(false);
        expect(r.hitbox({ x: 101, y: 25 })).toBe(false);
        expect(r.hitbox({ x: 50, y: -1 })).toBe(false);
        expect(r.hitbox({ x: 50, y: 51 })).toBe(false);
      });

      it('misses a point far outside', () => {
        expect(r.hitbox({ x: 500, y: 500 })).toBe(false);
      });
    });

    describe('with offset position', () => {
      const r = rect({ at: { x: 200, y: 100 }, width: 80, height: 40 });

      it('hits the center of the offset rect', () => {
        expect(r.hitbox({ x: 240, y: 120 })).toBe(true);
      });

      it('misses the origin when the rect is offset', () => {
        expect(r.hitbox({ x: 0, y: 0 })).toBe(false);
      });

      it('misses a point just outside the offset rect', () => {
        expect(r.hitbox({ x: 199, y: 120 })).toBe(false);
        expect(r.hitbox({ x: 281, y: 120 })).toBe(false);
      });
    });

    describe('with border radius', () => {
      const r = rect({
        at: { x: 0, y: 0 },
        width: 100,
        height: 100,
        borderRadius: 20,
      });

      it('hits the center', () => {
        expect(r.hitbox({ x: 50, y: 50 })).toBe(true);
      });

      it('hits edge midpoints (not affected by corner rounding)', () => {
        expect(r.hitbox({ x: 50, y: 0 })).toBe(true);
        expect(r.hitbox({ x: 50, y: 100 })).toBe(true);
        expect(r.hitbox({ x: 0, y: 50 })).toBe(true);
        expect(r.hitbox({ x: 100, y: 50 })).toBe(true);
      });

      it('misses the exact corners (cut off by rounding)', () => {
        expect(r.hitbox({ x: 0, y: 0 })).toBe(false);
        expect(r.hitbox({ x: 100, y: 0 })).toBe(false);
        expect(r.hitbox({ x: 0, y: 100 })).toBe(false);
        expect(r.hitbox({ x: 100, y: 100 })).toBe(false);
      });

      it('hits the arc center of a rounded corner', () => {
        // center of top-left arc is at (borderRadius, borderRadius)
        expect(r.hitbox({ x: 20, y: 20 })).toBe(true);
      });

      it('corners are inside when no borderRadius is set', () => {
        const flat = rect({ at: { x: 0, y: 0 }, width: 100, height: 100 });
        expect(flat.hitbox({ x: 0, y: 0 })).toBe(true);
      });
    });

    describe('with rotation', () => {
      // a narrow rect: 100 wide, 20 tall — rotation makes a point outside become inside
      const r = rect({
        at: { x: 0, y: 0 },
        width: 100,
        height: 20,
        rotation: Math.PI / 2,
      });

      it('hits the center regardless of rotation', () => {
        expect(r.hitbox({ x: 50, y: 10 })).toBe(true);
      });

      it('hits a point inside the rotated shape that would be outside unrotated', () => {
        // with rotation=0 this point is outside (y=30 > height=20)
        // with rotation=π/2 the rect sweeps a tall narrow area so (50, 30) is inside
        expect(r.hitbox({ x: 50, y: 30 })).toBe(true);
        const unrotated = rect({ at: { x: 0, y: 0 }, width: 100, height: 20 });
        expect(unrotated.hitbox({ x: 50, y: 30 })).toBe(false);
      });

      it('misses a point outside the rotated shape that would be inside unrotated', () => {
        // with rotation=0 this point is inside (x=90, y=10)
        // with rotation=π/2 the rotated rect does not extend that far horizontally
        expect(r.hitbox({ x: 90, y: 10 })).toBe(false);
        const unrotated = rect({ at: { x: 0, y: 0 }, width: 100, height: 20 });
        expect(unrotated.hitbox({ x: 90, y: 10 })).toBe(true);
      });
    });

    describe('with negative dimensions (normalization)', () => {
      // negative width/height draws the rect in the opposite direction
      const r = rect({ at: { x: 100, y: 50 }, width: -100, height: -50 });

      it('hits the center of the normalized rect', () => {
        expect(r.hitbox({ x: 50, y: 25 })).toBe(true);
      });

      it('hits the anchor point', () => {
        expect(r.hitbox({ x: 100, y: 50 })).toBe(true);
      });

      it('misses a point outside the normalized rect', () => {
        expect(r.hitbox({ x: 101, y: 25 })).toBe(false);
        expect(r.hitbox({ x: 50, y: 51 })).toBe(false);
      });
    });
  });
});
