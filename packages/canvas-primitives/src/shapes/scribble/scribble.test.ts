import { describe, expect, it, vi } from 'vitest';

import { SCRIBBLE_SCHEMA_DEFAULTS } from './defaults.ts';
import { scribble } from './index.ts';

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

describe('scribble', () => {
  describe('defaults', () => {
    it('has name "scribble"', () => {
      const s = scribble({
        type: 'draw',
        points: [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
        ],
      });
      expect(s.name).toBe('scribble');
    });

    it('defaults brushWeight to 3', () => {
      expect(SCRIBBLE_SCHEMA_DEFAULTS.brushWeight).toBe(3);
    });

    it('throws when points is empty', () => {
      expect(() => scribble({ type: 'draw', points: [] })).toThrow();
    });

    it('throws when brushWeight is less than 1', () => {
      expect(() =>
        scribble({ type: 'draw', points: [{ x: 0, y: 0 }], brushWeight: 0.5 }),
      ).toThrow();
    });

    it('returns the correct bounding box for a horizontal path', () => {
      // brushWeight=10: at expanded by -5 on each side, width/height expanded by 10
      const s = scribble({
        type: 'draw',
        points: [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
        ],
        brushWeight: 10,
      });
      const bbox = s.getBoundingBox();
      expect(bbox.at.x).toBe(-5);
      expect(bbox.at.y).toBe(-5);
      expect(bbox.width).toBe(110);
      expect(bbox.height).toBe(10);
    });
  });

  describe('hitbox', () => {
    describe('erase type always misses', () => {
      const eraser = scribble({
        type: 'erase',
        points: [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
        ],
      });

      it('misses the center of an erase scribble', () => {
        expect(eraser.hitbox({ x: 50, y: 0 })).toBe(false);
      });

      it('misses any point for erase type', () => {
        expect(eraser.hitbox({ x: 0, y: 0 })).toBe(false);
      });
    });

    describe('single-point draw scribble', () => {
      // single point uses a circle hitbox with radius = brushWeight
      const dot = scribble({
        type: 'draw',
        points: [{ x: 50, y: 50 }],
        brushWeight: 10,
      });

      it('hits the dot center', () => {
        expect(dot.hitbox({ x: 50, y: 50 })).toBe(true);
      });

      it('hits the dot edge (within the brushWeight bounding box)', () => {
        expect(dot.hitbox({ x: 55, y: 50 })).toBe(true);
      });

      it('misses just outside the bounding box', () => {
        expect(dot.hitbox({ x: 56, y: 50 })).toBe(false);
      });

      it('misses far outside', () => {
        expect(dot.hitbox({ x: 500, y: 500 })).toBe(false);
      });
    });

    describe('multi-point draw scribble', () => {
      // horizontal path from (0,0) to (100,0) with brushWeight=10
      const path = scribble({
        type: 'draw',
        points: [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
        ],
        brushWeight: 10,
      });

      it('hits the center of the path', () => {
        expect(path.hitbox({ x: 50, y: 0 })).toBe(true);
      });

      it('hits a point within the brush weight band', () => {
        expect(path.hitbox({ x: 50, y: 4 })).toBe(true);
      });

      it('misses a point outside the brush weight band', () => {
        expect(path.hitbox({ x: 50, y: 6 })).toBe(false);
      });

      it('misses far outside', () => {
        expect(path.hitbox({ x: 500, y: 500 })).toBe(false);
      });
    });
  });
});
