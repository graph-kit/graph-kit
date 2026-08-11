import { describe, expect, it, vi } from 'vitest';

import { circle } from './index.ts';

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

describe('circle', () => {
  describe('defaults', () => {
    it('has name "circle"', () => {
      const c = circle({ at: { x: 0, y: 0 }, radius: 50 });
      expect(c.name).toBe('circle');
    });

    it('maps radius to equal radiusX and radiusY in the bounding box', () => {
      const c = circle({ at: { x: 0, y: 0 }, radius: 40 });
      const bbox = c.getBoundingBox();
      expect(bbox.width).toBe(80);
      expect(bbox.height).toBe(80);
    });

    it('centers the bounding box on the at point', () => {
      const c = circle({ at: { x: 100, y: 200 }, radius: 30 });
      const bbox = c.getBoundingBox();
      expect(bbox.at.x).toBe(70);
      expect(bbox.at.y).toBe(170);
      expect(bbox.width).toBe(60);
      expect(bbox.height).toBe(60);
    });

    it('throws when radius is negative', () => {
      expect(() => circle({ at: { x: 0, y: 0 }, radius: -1 })).toThrow();
    });
  });

  describe('hitbox', () => {
    const c = circle({ at: { x: 0, y: 0 }, radius: 50 });

    describe('points inside', () => {
      it('hits the center (the at point)', () => {
        expect(c.hitbox({ x: 0, y: 0 })).toBe(true);
      });

      it('hits a point near the center', () => {
        expect(c.hitbox({ x: 10, y: 10 })).toBe(true);
      });

      it('hits a point on the circular edge', () => {
        expect(c.hitbox({ x: 50, y: 0 })).toBe(true);
        expect(c.hitbox({ x: -50, y: 0 })).toBe(true);
        expect(c.hitbox({ x: 0, y: 50 })).toBe(true);
        expect(c.hitbox({ x: 0, y: -50 })).toBe(true);
      });

      it('hits a point on the diagonal inside the circle', () => {
        // 35² + 35² = 2450, 50² = 2500 → inside
        expect(c.hitbox({ x: 35, y: 35 })).toBe(true);
      });
    });

    describe('points outside', () => {
      it('misses a point just beyond the radius', () => {
        expect(c.hitbox({ x: 51, y: 0 })).toBe(false);
        expect(c.hitbox({ x: -51, y: 0 })).toBe(false);
        expect(c.hitbox({ x: 0, y: 51 })).toBe(false);
        expect(c.hitbox({ x: 0, y: -51 })).toBe(false);
      });

      it('misses a point on the diagonal outside the circle', () => {
        // 36² + 36² = 2592, 50² = 2500 → outside
        expect(c.hitbox({ x: 36, y: 36 })).toBe(false);
      });

      it('misses a point at the bounding box corner (outside the circle)', () => {
        // corners of the bounding box are outside the inscribed circle
        expect(c.hitbox({ x: 50, y: 50 })).toBe(false);
      });

      it('misses a point far outside', () => {
        expect(c.hitbox({ x: 500, y: 500 })).toBe(false);
      });
    });

    describe('with offset position', () => {
      const offset = circle({ at: { x: 100, y: 200 }, radius: 30 });

      it('hits the center of the offset circle', () => {
        expect(offset.hitbox({ x: 100, y: 200 })).toBe(true);
      });

      it('hits the edge of the offset circle', () => {
        expect(offset.hitbox({ x: 130, y: 200 })).toBe(true);
        expect(offset.hitbox({ x: 100, y: 230 })).toBe(true);
      });

      it('misses the origin when the circle is offset', () => {
        expect(offset.hitbox({ x: 0, y: 0 })).toBe(false);
      });

      it('misses a point just beyond the edge of the offset circle', () => {
        expect(offset.hitbox({ x: 131, y: 200 })).toBe(false);
      });
    });
  });
});
