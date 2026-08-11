import { describe, expect, it, vi } from 'vitest';

import { ARROW_SCHEMA_DEFAULTS } from './defaults.ts';
import { arrow } from './index.ts';

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

describe('arrow', () => {
  describe('defaults', () => {
    it('has name "arrow"', () => {
      const a = arrow({ start: { x: 0, y: 0 }, end: { x: 100, y: 0 } });
      expect(a.name).toBe('arrow');
    });

    it('defaults lineWidth to 10', () => {
      expect(ARROW_SCHEMA_DEFAULTS.lineWidth).toBe(10);
    });

    it('throws when lineWidth is negative', () => {
      expect(() =>
        arrow({ start: { x: 0, y: 0 }, end: { x: 100, y: 0 }, lineWidth: -1 }),
      ).toThrow();
    });
  });

  describe('hitbox', () => {
    // arrow from (0,0) to (100,0), lineWidth=10 (default)
    // arrowhead: tip at (100,0), base corners at approximately (75, ±14.3)
    const a = arrow({ start: { x: 0, y: 0 }, end: { x: 100, y: 0 } });

    describe('shaft', () => {
      it('hits the center of the shaft', () => {
        expect(a.hitbox({ x: 50, y: 0 })).toBe(true);
      });

      it('hits a point within half the line width of the shaft', () => {
        expect(a.hitbox({ x: 50, y: 4 })).toBe(true);
      });

      it('hits the start endpoint', () => {
        expect(a.hitbox({ x: 0, y: 0 })).toBe(true);
      });

      it('misses a point perpendicular to the shaft beyond lineWidth/2', () => {
        expect(a.hitbox({ x: 50, y: 20 })).toBe(false);
      });
    });

    describe('arrowhead', () => {
      // (87, 6) is inside the arrowhead triangle but outside the shaft (6 > lineWidth/2=5)
      it('hits a point inside the arrowhead that is outside the shaft', () => {
        expect(a.hitbox({ x: 87, y: 6 })).toBe(true);
      });

      it('misses the exact tip of the arrow', () => {
        // the tip at (100,0) is the outer vertex; slightly past it is outside
        expect(a.hitbox({ x: 110, y: 0 })).toBe(false);
      });
    });

    describe('with offset position', () => {
      const a2 = arrow({ start: { x: 200, y: 100 }, end: { x: 300, y: 100 } });

      it('hits the center of the offset arrow shaft', () => {
        expect(a2.hitbox({ x: 250, y: 100 })).toBe(true);
      });

      it('misses the origin when the arrow is offset', () => {
        expect(a2.hitbox({ x: 0, y: 0 })).toBe(false);
      });
    });

    it('misses a point far outside', () => {
      expect(a.hitbox({ x: 500, y: 500 })).toBe(false);
    });
  });
});
