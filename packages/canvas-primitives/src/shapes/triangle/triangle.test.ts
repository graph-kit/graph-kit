import { describe, expect, it, vi } from 'vitest';

import { triangle } from './index.ts';

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

describe('triangle', () => {
  describe('defaults', () => {
    it('has name "triangle"', () => {
      const t = triangle({
        pointA: { x: 0, y: 0 },
        pointB: { x: 100, y: 0 },
        pointC: { x: 50, y: 100 },
      });
      expect(t.name).toBe('triangle');
    });

    it('returns the correct bounding box', () => {
      const t = triangle({
        pointA: { x: 0, y: 0 },
        pointB: { x: 100, y: 0 },
        pointC: { x: 50, y: 100 },
      });
      const bbox = t.getBoundingBox();
      expect(bbox.at.x).toBe(0);
      expect(bbox.at.y).toBe(0);
      expect(bbox.width).toBe(100);
      expect(bbox.height).toBe(100);
    });

    it('returns the correct bounding box for an offset triangle', () => {
      const t = triangle({
        pointA: { x: 10, y: 20 },
        pointB: { x: 110, y: 20 },
        pointC: { x: 60, y: 120 },
      });
      const bbox = t.getBoundingBox();
      expect(bbox.at.x).toBe(10);
      expect(bbox.at.y).toBe(20);
      expect(bbox.width).toBe(100);
      expect(bbox.height).toBe(100);
    });
  });

  describe('hitbox', () => {
    // triangle with pointA=(0,0), pointB=(100,0), pointC=(50,100)
    const t = triangle({
      pointA: { x: 0, y: 0 },
      pointB: { x: 100, y: 0 },
      pointC: { x: 50, y: 100 },
    });

    describe('points inside', () => {
      it('hits the centroid', () => {
        expect(t.hitbox({ x: 50, y: 33 })).toBe(true);
      });

      it('hits a point in the lower half', () => {
        expect(t.hitbox({ x: 50, y: 50 })).toBe(true);
      });

      it('hits a point near the apex', () => {
        expect(t.hitbox({ x: 50, y: 99 })).toBe(true);
      });

      it('hits a point near the base left corner', () => {
        expect(t.hitbox({ x: 25, y: 10 })).toBe(true);
      });
    });

    describe('points outside', () => {
      it('misses a point above the apex', () => {
        expect(t.hitbox({ x: 50, y: 101 })).toBe(false);
      });

      it('misses a point to the right of the triangle', () => {
        expect(t.hitbox({ x: 100, y: 50 })).toBe(false);
      });

      it('misses a point to the left of the triangle', () => {
        expect(t.hitbox({ x: -1, y: 50 })).toBe(false);
      });

      it('misses a point far outside', () => {
        expect(t.hitbox({ x: 500, y: 500 })).toBe(false);
      });
    });

    describe('right triangle', () => {
      const rt = triangle({
        pointA: { x: 0, y: 0 },
        pointB: { x: 100, y: 0 },
        pointC: { x: 0, y: 100 },
      });

      it('hits the interior of a right triangle', () => {
        expect(rt.hitbox({ x: 20, y: 20 })).toBe(true);
      });

      it('misses a point outside the hypotenuse', () => {
        expect(rt.hitbox({ x: 60, y: 60 })).toBe(false);
      });
    });
  });
});
