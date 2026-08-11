import { describe, expect, it, vi } from 'vitest';

import { CROSS_SCHEMA_DEFAULTS } from './defaults.ts';
import { cross } from './index.ts';

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

describe('cross', () => {
  describe('defaults', () => {
    it('has name "cross"', () => {
      const c = cross({ at: { x: 0, y: 0 }, size: 100 });
      expect(c.name).toBe('cross');
    });

    it('defaults lineWidth to 10', () => {
      expect(CROSS_SCHEMA_DEFAULTS.lineWidth).toBe(10);
    });

    it('defaults rotation to 0', () => {
      expect(CROSS_SCHEMA_DEFAULTS.rotation).toBe(0);
    });

    it('defaults borderRadius to 0', () => {
      expect(CROSS_SCHEMA_DEFAULTS.borderRadius).toBe(0);
    });

    it('returns the correct bounding box', () => {
      const c = cross({ at: { x: 0, y: 0 }, size: 100 });
      const bbox = c.getBoundingBox();
      expect(bbox.at.x).toBe(-50);
      expect(bbox.at.y).toBe(-50);
      expect(bbox.width).toBe(100);
      expect(bbox.height).toBe(100);
    });

    it('centers the bounding box on the at point', () => {
      const c = cross({ at: { x: 50, y: 80 }, size: 60 });
      const bbox = c.getBoundingBox();
      expect(bbox.at.x).toBe(20);
      expect(bbox.at.y).toBe(50);
      expect(bbox.width).toBe(60);
      expect(bbox.height).toBe(60);
    });
  });

  describe('hitbox', () => {
    // cross at (0,0), size=100, lineWidth=10 (default)
    // horizontal arm: rect from (-50,-5) to (50,5)
    // vertical arm:   rect from (-5,-50) to (5,50)
    const c = cross({ at: { x: 0, y: 0 }, size: 100 });

    describe('center and arms', () => {
      it('hits the center', () => {
        expect(c.hitbox({ x: 0, y: 0 })).toBe(true);
      });

      it('hits the end of the horizontal right arm', () => {
        expect(c.hitbox({ x: 50, y: 0 })).toBe(true);
      });

      it('hits the end of the horizontal left arm', () => {
        expect(c.hitbox({ x: -50, y: 0 })).toBe(true);
      });

      it('hits the end of the vertical bottom arm', () => {
        expect(c.hitbox({ x: 0, y: 50 })).toBe(true);
      });

      it('hits the end of the vertical top arm', () => {
        expect(c.hitbox({ x: 0, y: -50 })).toBe(true);
      });
    });

    describe('misses between arms', () => {
      it('misses a point in the top-right gap between arms', () => {
        expect(c.hitbox({ x: 20, y: 20 })).toBe(false);
      });

      it('misses a point in the bottom-left gap between arms', () => {
        expect(c.hitbox({ x: -20, y: -20 })).toBe(false);
      });

      it('misses a point just outside the horizontal arm', () => {
        expect(c.hitbox({ x: 50, y: 6 })).toBe(false);
      });

      it('misses a point just beyond the arm tip', () => {
        expect(c.hitbox({ x: 51, y: 0 })).toBe(false);
      });

      it('misses a point far outside', () => {
        expect(c.hitbox({ x: 500, y: 500 })).toBe(false);
      });
    });

    describe('with offset position', () => {
      const c2 = cross({ at: { x: 100, y: 200 }, size: 60 });

      it('hits the center of the offset cross', () => {
        expect(c2.hitbox({ x: 100, y: 200 })).toBe(true);
      });

      it('hits the end of an arm of the offset cross', () => {
        expect(c2.hitbox({ x: 130, y: 200 })).toBe(true);
      });

      it('misses the origin when the cross is offset', () => {
        expect(c2.hitbox({ x: 0, y: 0 })).toBe(false);
      });
    });
  });
});
