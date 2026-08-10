import { describe, expect, it, vi } from 'vitest';

import { ELLIPSE_SCHEMA_DEFAULTS } from './defaults.ts';
import { ellipse } from './index.ts';

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

describe('ellipse', () => {
  describe('defaults', () => {
    it('has name "ellipse"', () => {
      const e = ellipse({ at: { x: 0, y: 0 }, radiusX: 60, radiusY: 30 });
      expect(e.name).toBe('ellipse');
    });

    it('defaults fillColor to "black"', () => {
      expect(ELLIPSE_SCHEMA_DEFAULTS.fillColor).toBe('black');
    });

    it('throws when radiusX is negative', () => {
      expect(() =>
        ellipse({ at: { x: 0, y: 0 }, radiusX: -1, radiusY: 30 }),
      ).toThrow();
    });

    it('throws when radiusY is negative', () => {
      expect(() =>
        ellipse({ at: { x: 0, y: 0 }, radiusX: 60, radiusY: -1 }),
      ).toThrow();
    });

    it('returns the correct bounding box', () => {
      const e = ellipse({ at: { x: 0, y: 0 }, radiusX: 60, radiusY: 30 });
      const bbox = e.getBoundingBox();
      expect(bbox.at.x).toBe(-60);
      expect(bbox.at.y).toBe(-30);
      expect(bbox.width).toBe(120);
      expect(bbox.height).toBe(60);
    });

    it('centers the bounding box on the at point', () => {
      const e = ellipse({ at: { x: 100, y: 50 }, radiusX: 40, radiusY: 20 });
      const bbox = e.getBoundingBox();
      expect(bbox.at.x).toBe(60);
      expect(bbox.at.y).toBe(30);
      expect(bbox.width).toBe(80);
      expect(bbox.height).toBe(40);
    });

    it('expands the bounding box when a stroke is present', () => {
      const e = ellipse({
        at: { x: 0, y: 0 },
        radiusX: 50,
        radiusY: 25,
        stroke: { color: 'red', lineWidth: 20 },
      });
      const bbox = e.getBoundingBox();
      // stroke expands each side by lineWidth/2 = 10
      expect(bbox.at.x).toBe(-60);
      expect(bbox.at.y).toBe(-35);
      expect(bbox.width).toBe(120);
      expect(bbox.height).toBe(70);
    });
  });

  describe('hitbox', () => {
    // ellipse at (0,0), radiusX=60, radiusY=30
    // a point (px,py) is inside if px²/60² + py²/30² <= 1
    const e = ellipse({ at: { x: 0, y: 0 }, radiusX: 60, radiusY: 30 });

    describe('points inside', () => {
      it('hits the center', () => {
        expect(e.hitbox({ x: 0, y: 0 })).toBe(true);
      });

      it('hits a point on the horizontal edge', () => {
        expect(e.hitbox({ x: 60, y: 0 })).toBe(true);
      });

      it('hits a point on the vertical edge', () => {
        expect(e.hitbox({ x: 0, y: 30 })).toBe(true);
      });

      it('hits a point diagonally inside', () => {
        // 42²/3600 + 20²/900 = 0.49 + 0.44 = 0.93 ≤ 1
        expect(e.hitbox({ x: 42, y: 20 })).toBe(true);
      });
    });

    describe('points outside', () => {
      it('misses a point just beyond the horizontal edge', () => {
        expect(e.hitbox({ x: 61, y: 0 })).toBe(false);
      });

      it('misses a point just beyond the vertical edge', () => {
        expect(e.hitbox({ x: 0, y: 31 })).toBe(false);
      });

      it('misses a point diagonally outside', () => {
        // 50²/3600 + 25²/900 = 0.694 + 0.694 = 1.39 > 1
        expect(e.hitbox({ x: 50, y: 25 })).toBe(false);
      });

      it('misses the bounding box corner (outside the ellipse)', () => {
        expect(e.hitbox({ x: 60, y: 30 })).toBe(false);
      });

      it('misses a point far outside', () => {
        expect(e.hitbox({ x: 500, y: 500 })).toBe(false);
      });
    });

    describe('with offset position', () => {
      const e2 = ellipse({ at: { x: 100, y: 200 }, radiusX: 40, radiusY: 20 });

      it('hits the center of the offset ellipse', () => {
        expect(e2.hitbox({ x: 100, y: 200 })).toBe(true);
      });

      it('hits the horizontal edge of the offset ellipse', () => {
        expect(e2.hitbox({ x: 140, y: 200 })).toBe(true);
      });

      it('misses the origin when the ellipse is offset', () => {
        expect(e2.hitbox({ x: 0, y: 0 })).toBe(false);
      });

      it('misses a point just beyond the offset ellipse edge', () => {
        expect(e2.hitbox({ x: 141, y: 200 })).toBe(false);
      });
    });
  });
});
