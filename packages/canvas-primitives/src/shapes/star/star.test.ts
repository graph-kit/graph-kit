import { describe, expect, it, vi } from 'vitest';

import { STAR_SCHEMA_DEFAULTS } from './defaults.ts';
import { star } from './index.ts';

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

describe('star', () => {
  describe('defaults', () => {
    it('has name "star"', () => {
      const s = star({ at: { x: 0, y: 0 }, innerRadius: 20, outerRadius: 50 });
      expect(s.name).toBe('star');
    });

    it('defaults rotation to 0', () => {
      expect(STAR_SCHEMA_DEFAULTS.rotation).toBe(0);
    });

    it('defaults points to 5', () => {
      expect(STAR_SCHEMA_DEFAULTS.points).toBe(5);
    });

    it('returns the correct bounding box based on outerRadius', () => {
      const s = star({ at: { x: 0, y: 0 }, innerRadius: 20, outerRadius: 50 });
      const bbox = s.getBoundingBox();
      expect(bbox.at.x).toBe(-50);
      expect(bbox.at.y).toBe(-50);
      expect(bbox.width).toBe(100);
      expect(bbox.height).toBe(100);
    });

    it('centers the bounding box on the at point', () => {
      const s = star({
        at: { x: 100, y: 200 },
        innerRadius: 10,
        outerRadius: 30,
      });
      const bbox = s.getBoundingBox();
      expect(bbox.at.x).toBe(70);
      expect(bbox.at.y).toBe(170);
      expect(bbox.width).toBe(60);
      expect(bbox.height).toBe(60);
    });
  });

  describe('hitbox', () => {
    // 5-pointed star at (0,0), innerRadius=20, outerRadius=50
    const s = star({ at: { x: 0, y: 0 }, innerRadius: 20, outerRadius: 50 });

    describe('points inside', () => {
      it('hits the center', () => {
        expect(s.hitbox({ x: 0, y: 0 })).toBe(true);
      });

      it('hits a point along a tip toward the outer radius', () => {
        expect(s.hitbox({ x: 40, y: 0 })).toBe(true);
      });

      it('hits a point between the center and the inner vertex along the negative x-axis', () => {
        // the inner vertex is at (-20, 0); (-15, 0) is inside the star polygon
        expect(s.hitbox({ x: -15, y: 0 })).toBe(true);
      });
    });

    describe('points outside', () => {
      it('misses a point beyond the outer tip', () => {
        expect(s.hitbox({ x: 55, y: 0 })).toBe(false);
      });

      it('misses a point far outside', () => {
        expect(s.hitbox({ x: 500, y: 500 })).toBe(false);
      });
    });

    describe('with offset position', () => {
      const s2 = star({
        at: { x: 100, y: 200 },
        innerRadius: 20,
        outerRadius: 50,
      });

      it('hits the center of the offset star', () => {
        expect(s2.hitbox({ x: 100, y: 200 })).toBe(true);
      });

      it('misses the origin when the star is offset', () => {
        expect(s2.hitbox({ x: 0, y: 0 })).toBe(false);
      });

      it('misses a point beyond the offset star tip', () => {
        expect(s2.hitbox({ x: 156, y: 200 })).toBe(false);
      });
    });

    describe('with custom point count', () => {
      const s3 = star({
        at: { x: 0, y: 0 },
        innerRadius: 20,
        outerRadius: 50,
        points: 6,
      });

      it('hits the center of a 6-pointed star', () => {
        expect(s3.hitbox({ x: 0, y: 0 })).toBe(true);
      });

      it('misses a point beyond the outer radius of the 6-pointed star', () => {
        expect(s3.hitbox({ x: 55, y: 0 })).toBe(false);
      });
    });
  });
});
