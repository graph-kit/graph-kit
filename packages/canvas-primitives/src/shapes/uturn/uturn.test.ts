import { describe, expect, it, vi } from 'vitest';

import { UTURN_SCHEMA_DEFAULTS } from './defaults.ts';
import { uturn } from './index.ts';

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

describe('uturn', () => {
  describe('defaults', () => {
    it('has name "uturn"', () => {
      const u = uturn({
        at: { x: 0, y: 0 },
        spacing: 20,
        upDistance: 100,
        downDistance: 50,
      });
      expect(u.name).toBe('uturn');
    });

    it('defaults rotation to 0', () => {
      expect(UTURN_SCHEMA_DEFAULTS.rotation).toBe(0);
    });

    it('defaults lineWidth to 10', () => {
      expect(UTURN_SCHEMA_DEFAULTS.lineWidth).toBe(10);
    });

    it('throws when upDistance is negative', () => {
      expect(() =>
        uturn({
          at: { x: 0, y: 0 },
          spacing: 20,
          upDistance: -1,
          downDistance: 50,
        }),
      ).toThrow();
    });

    it('throws when downDistance is negative', () => {
      expect(() =>
        uturn({
          at: { x: 0, y: 0 },
          spacing: 20,
          upDistance: 100,
          downDistance: -1,
        }),
      ).toThrow();
    });

    it('returns the correct bounding box', () => {
      // at=(0,0), upDistance=100, spacing=20, lineWidth=10 (default)
      // minX = min(0,100) - lineWidth/2 - spacing = -25
      // minY = min(0,0)   - lineWidth/2 - spacing = -25
      // maxX = max(0,100) + lineWidth/2 + spacing = 125
      // maxY = max(0,0)   + lineWidth/2 + spacing = 25
      const u = uturn({
        at: { x: 0, y: 0 },
        spacing: 20,
        upDistance: 100,
        downDistance: 50,
      });
      const bbox = u.getBoundingBox();
      expect(bbox.at.x).toBe(-25);
      expect(bbox.at.y).toBe(-25);
      expect(bbox.width).toBe(150);
      expect(bbox.height).toBe(50);
    });
  });

  describe('hitbox', () => {
    // at=(0,0), spacing=20, upDistance=100, downDistance=50, lineWidth=10 (default), rotation=0
    // long leg:  line from (0,-20)  to (100,-20) — the "going out" arm
    // short leg: arrow from (100,20) to (50,20)  — the "return" arm with arrowhead
    // arc:       circle at (100,0), radius = spacing + lineWidth/2 = 25
    const u = uturn({
      at: { x: 0, y: 0 },
      spacing: 20,
      upDistance: 100,
      downDistance: 50,
    });

    describe('long leg', () => {
      it('hits the center of the long leg', () => {
        expect(u.hitbox({ x: 50, y: -20 })).toBe(true);
      });

      it('hits the start of the long leg', () => {
        expect(u.hitbox({ x: 0, y: -20 })).toBe(true);
      });

      it('misses a point perpendicular to the long leg beyond lineWidth/2', () => {
        expect(u.hitbox({ x: 50, y: -26 })).toBe(false);
      });
    });

    describe('short leg (arrow)', () => {
      it('hits the center of the short leg', () => {
        expect(u.hitbox({ x: 75, y: 20 })).toBe(true);
      });

      it('hits the end of the short leg', () => {
        expect(u.hitbox({ x: 50, y: 20 })).toBe(true);
      });

      it('misses a point past the base of the arrowhead', () => {
        // (76, 26) is to the right of the arrowhead base (x=75) and off the shaft
        expect(u.hitbox({ x: 76, y: 26 })).toBe(false);
      });
    });

    describe('arc', () => {
      it('hits the arc center', () => {
        expect(u.hitbox({ x: 100, y: 0 })).toBe(true);
      });

      it('hits a point inside the arc', () => {
        expect(u.hitbox({ x: 100, y: 24 })).toBe(true);
      });

      it('misses a point just outside the arc', () => {
        expect(u.hitbox({ x: 100, y: 26 })).toBe(false);
      });
    });

    it('misses a point in the open interior of the U', () => {
      expect(u.hitbox({ x: 50, y: 0 })).toBe(false);
    });

    it('misses a point far outside', () => {
      expect(u.hitbox({ x: 500, y: 500 })).toBe(false);
    });
  });
});
