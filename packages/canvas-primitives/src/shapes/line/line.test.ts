import { describe, expect, it, vi } from 'vitest';

import { LINE_SCHEMA_DEFAULTS } from './defaults.ts';
import { line } from './index.ts';

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

describe('line', () => {
  describe('defaults', () => {
    it('has name "line"', () => {
      const l = line({ start: { x: 0, y: 0 }, end: { x: 100, y: 0 } });
      expect(l.name).toBe('line');
    });

    it('defaults fillColor to "black"', () => {
      expect(LINE_SCHEMA_DEFAULTS.fillColor).toBe('black');
    });

    it('defaults lineWidth to 10', () => {
      expect(LINE_SCHEMA_DEFAULTS.lineWidth).toBe(10);
    });

    it('defaults textOffsetFromCenter to 0', () => {
      expect(LINE_SCHEMA_DEFAULTS.textOffsetFromCenter).toBe(0);
    });

    it('throws when lineWidth is negative', () => {
      expect(() =>
        line({ start: { x: 0, y: 0 }, end: { x: 100, y: 0 }, lineWidth: -1 }),
      ).toThrow();
    });

    it('returns the correct bounding box for a horizontal line', () => {
      const l = line({
        start: { x: 0, y: 0 },
        end: { x: 100, y: 0 },
        lineWidth: 10,
      });
      const bbox = l.getBoundingBox();
      expect(bbox.at.x).toBe(-5);
      expect(bbox.at.y).toBe(-5);
      expect(bbox.width).toBe(110);
      expect(bbox.height).toBe(10);
    });

    it('returns the correct bounding box for a vertical line', () => {
      const l = line({
        start: { x: 0, y: 0 },
        end: { x: 0, y: 80 },
        lineWidth: 10,
      });
      const bbox = l.getBoundingBox();
      expect(bbox.at.x).toBe(-5);
      expect(bbox.at.y).toBe(-5);
      expect(bbox.width).toBe(10);
      expect(bbox.height).toBe(90);
    });
  });

  describe('hitbox', () => {
    describe('horizontal line', () => {
      // lineWidth defaults to 10, so the hit zone extends 5 units perpendicular
      const l = line({ start: { x: 0, y: 0 }, end: { x: 100, y: 0 } });

      it('hits the center of the line', () => {
        expect(l.hitbox({ x: 50, y: 0 })).toBe(true);
      });

      it('hits a point within half the line width', () => {
        expect(l.hitbox({ x: 50, y: 4 })).toBe(true);
      });

      it('hits a point exactly at half the line width', () => {
        expect(l.hitbox({ x: 50, y: 5 })).toBe(true);
      });

      it('hits the start endpoint', () => {
        expect(l.hitbox({ x: 0, y: 0 })).toBe(true);
      });

      it('hits the end endpoint', () => {
        expect(l.hitbox({ x: 100, y: 0 })).toBe(true);
      });

      it('hits a point within the circular end cap', () => {
        expect(l.hitbox({ x: 104, y: 0 })).toBe(true);
      });

      it('misses a point just outside the line width', () => {
        expect(l.hitbox({ x: 50, y: 6 })).toBe(false);
      });

      it('misses a point just beyond the end cap', () => {
        expect(l.hitbox({ x: 106, y: 0 })).toBe(false);
      });

      it('misses a point just beyond the start cap', () => {
        expect(l.hitbox({ x: -6, y: 0 })).toBe(false);
      });

      it('misses a point far outside', () => {
        expect(l.hitbox({ x: 500, y: 500 })).toBe(false);
      });
    });

    describe('with offset position', () => {
      const l = line({ start: { x: 50, y: 100 }, end: { x: 150, y: 100 } });

      it('hits the center of the offset line', () => {
        expect(l.hitbox({ x: 100, y: 100 })).toBe(true);
      });

      it('misses the origin when line is offset', () => {
        expect(l.hitbox({ x: 0, y: 0 })).toBe(false);
      });

      it('misses a point just outside the offset line', () => {
        expect(l.hitbox({ x: 100, y: 106 })).toBe(false);
      });
    });

    describe('diagonal line', () => {
      const l = line({
        start: { x: 0, y: 0 },
        end: { x: 100, y: 100 },
        lineWidth: 10,
      });

      it('hits the midpoint of the diagonal', () => {
        expect(l.hitbox({ x: 50, y: 50 })).toBe(true);
      });

      it('misses a point clearly off the diagonal', () => {
        expect(l.hitbox({ x: 0, y: 100 })).toBe(false);
      });
    });
  });
});
