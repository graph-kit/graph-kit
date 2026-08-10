import { describe, expect, it, vi } from 'vitest';

import { IMAGE_SCHEMA_DEFAULTS } from './defaults.ts';
import { image } from './index.ts';

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

describe('image', () => {
  describe('defaults', () => {
    it('has name "image"', () => {
      const img = image({
        at: { x: 0, y: 0 },
        width: 100,
        height: 50,
        src: 'test.png',
      });
      expect(img.name).toBe('image');
    });

    it('defaults rotation to 0', () => {
      expect(IMAGE_SCHEMA_DEFAULTS.rotation).toBe(0);
    });

    it('throws when width is negative', () => {
      expect(() =>
        image({ at: { x: 0, y: 0 }, width: -1, height: 50, src: 'test.png' }),
      ).toThrow();
    });

    it('throws when height is negative', () => {
      expect(() =>
        image({ at: { x: 0, y: 0 }, width: 100, height: -1, src: 'test.png' }),
      ).toThrow();
    });

    it('returns the correct bounding box size', () => {
      const img = image({
        at: { x: 0, y: 0 },
        width: 100,
        height: 50,
        src: 'test.png',
      });
      const bbox = img.getBoundingBox();
      expect(bbox.width).toBe(100);
      expect(bbox.height).toBe(50);
    });

    it('preserves the anchor point in the bounding box', () => {
      const img = image({
        at: { x: 30, y: 40 },
        width: 100,
        height: 50,
        src: 'test.png',
      });
      const bbox = img.getBoundingBox();
      expect(bbox.at.x).toBe(30);
      expect(bbox.at.y).toBe(40);
    });
  });

  describe('hitbox', () => {
    // image hitbox delegates to rect — same axis-aligned rectangle logic
    const img = image({
      at: { x: 0, y: 0 },
      width: 100,
      height: 50,
      src: 'test.png',
    });

    describe('points inside', () => {
      it('hits the center', () => {
        expect(img.hitbox({ x: 50, y: 25 })).toBe(true);
      });

      it('hits all four corners', () => {
        expect(img.hitbox({ x: 0, y: 0 })).toBe(true);
        expect(img.hitbox({ x: 100, y: 0 })).toBe(true);
        expect(img.hitbox({ x: 0, y: 50 })).toBe(true);
        expect(img.hitbox({ x: 100, y: 50 })).toBe(true);
      });

      it('hits edge midpoints', () => {
        expect(img.hitbox({ x: 50, y: 0 })).toBe(true);
        expect(img.hitbox({ x: 50, y: 50 })).toBe(true);
        expect(img.hitbox({ x: 0, y: 25 })).toBe(true);
        expect(img.hitbox({ x: 100, y: 25 })).toBe(true);
      });
    });

    describe('points outside', () => {
      it('misses a point just beyond each edge', () => {
        expect(img.hitbox({ x: -1, y: 25 })).toBe(false);
        expect(img.hitbox({ x: 101, y: 25 })).toBe(false);
        expect(img.hitbox({ x: 50, y: -1 })).toBe(false);
        expect(img.hitbox({ x: 50, y: 51 })).toBe(false);
      });

      it('misses a point far outside', () => {
        expect(img.hitbox({ x: 500, y: 500 })).toBe(false);
      });
    });

    describe('with offset position', () => {
      const img2 = image({
        at: { x: 200, y: 100 },
        width: 80,
        height: 40,
        src: 'test.png',
      });

      it('hits the center of the offset image', () => {
        expect(img2.hitbox({ x: 240, y: 120 })).toBe(true);
      });

      it('misses the origin when the image is offset', () => {
        expect(img2.hitbox({ x: 0, y: 0 })).toBe(false);
      });

      it('misses a point just outside the offset image', () => {
        expect(img2.hitbox({ x: 199, y: 120 })).toBe(false);
        expect(img2.hitbox({ x: 281, y: 120 })).toBe(false);
      });
    });
  });
});
