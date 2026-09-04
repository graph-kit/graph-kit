import { describe, expect, it, vi } from 'vitest';

import { region } from './index.ts';
import type { RegionMember } from './types.ts';

vi.mock('@core/utils/canvas/index', () => ({
  getClientCoordinates: vi.fn(),
  getCtx: vi.fn(),
}));

const bounds = { at: { x: -100, y: -100 }, width: 200, height: 200 };

const circleAt = (x: number, y: number, radius: number): RegionMember => ({
  shape: 'circle',
  at: { x, y },
  radius,
});

describe('region', () => {
  it('has name "region"', () => {
    expect(region({ inside: [], outside: [], bounds }).name).toBe('region');
  });

  it('throws on bounds with a negative dimension', () => {
    expect(() =>
      region({
        inside: [],
        outside: [],
        bounds: { at: { x: 0, y: 0 }, width: -1, height: 10 },
      }),
    ).toThrow();
  });

  describe('hitbox', () => {
    it('is inside every member of inside', () => {
      const overlap = region({
        inside: [circleAt(-10, 0, 50), circleAt(10, 0, 50)],
        outside: [],
        bounds,
      });

      expect(overlap.hitbox({ x: 0, y: 0 })).toBe(true);
      // inside the left circle only
      expect(overlap.hitbox({ x: -55, y: 0 })).toBe(false);
      // inside the right circle only
      expect(overlap.hitbox({ x: 55, y: 0 })).toBe(false);
    });

    it('is outside every member of outside', () => {
      const ring = region({
        inside: [circleAt(0, 0, 50)],
        outside: [circleAt(0, 0, 20)],
        bounds,
      });

      expect(ring.hitbox({ x: 35, y: 0 })).toBe(true);
      expect(ring.hitbox({ x: 0, y: 0 })).toBe(false);
      expect(ring.hitbox({ x: 60, y: 0 })).toBe(false);
    });

    it('treats an empty inside as all of bounds, minus the outsides', () => {
      const everythingElse = region({
        inside: [],
        outside: [circleAt(0, 0, 50)],
        bounds,
      });

      expect(everythingElse.hitbox({ x: 90, y: 90 })).toBe(true);
      expect(everythingElse.hitbox({ x: 0, y: 0 })).toBe(false);
    });

    it('never reaches outside bounds', () => {
      const unbounded = region({
        inside: [],
        outside: [],
        bounds: { at: { x: 0, y: 0 }, width: 10, height: 10 },
      });

      expect(unbounded.hitbox({ x: 5, y: 5 })).toBe(true);
      expect(unbounded.hitbox({ x: 11, y: 5 })).toBe(false);
    });

    it('ignores a member stroke, which would otherwise inflate the hitbox', () => {
      const stroked = region({
        inside: [
          { ...circleAt(0, 0, 50), stroke: { color: 'red', lineWidth: 20 } },
        ],
        outside: [],
        bounds,
      });

      // an ellipse hitbox grows by half the stroke width, so 55 would hit
      expect(stroked.hitbox({ x: 55, y: 0 })).toBe(false);
      expect(stroked.hitbox({ x: 50, y: 0 })).toBe(true);
    });

    describe('the resize band the sets product needs', () => {
      const RADIUS = 70;
      const BUFFER = 10;

      const band = region({
        inside: [circleAt(0, 0, RADIUS + BUFFER)],
        outside: [circleAt(0, 0, RADIUS - BUFFER)],
        bounds,
      });

      it('hits within the buffer either side of the edge', () => {
        expect(band.hitbox({ x: RADIUS, y: 0 })).toBe(true);
        expect(band.hitbox({ x: RADIUS + BUFFER - 1, y: 0 })).toBe(true);
        expect(band.hitbox({ x: RADIUS - BUFFER + 1, y: 0 })).toBe(true);
      });

      it('misses the body and the outside', () => {
        expect(band.hitbox({ x: 0, y: 0 })).toBe(false);
        expect(band.hitbox({ x: RADIUS - BUFFER - 1, y: 0 })).toBe(false);
        expect(band.hitbox({ x: RADIUS + BUFFER + 1, y: 0 })).toBe(false);
      });
    });
  });

  describe('getBoundingBox', () => {
    it('is bounds when nothing narrows it', () => {
      const box = region({ inside: [], outside: [], bounds }).getBoundingBox();
      expect(box).toEqual(bounds);
    });

    it('narrows to the intersection of the insides', () => {
      const box = region({
        inside: [circleAt(-10, 0, 50), circleAt(10, 0, 50)],
        outside: [],
        bounds,
      }).getBoundingBox();

      // left circle spans [-60, 40], right spans [-40, 60]
      expect(box.at.x).toBe(-40);
      expect(box.width).toBe(80);
      expect(box.at.y).toBe(-50);
      expect(box.height).toBe(100);
    });

    it('is not widened past bounds by a member that overflows them', () => {
      const box = region({
        inside: [circleAt(0, 0, 500)],
        outside: [],
        bounds,
      }).getBoundingBox();

      expect(box).toEqual(bounds);
    });

    it('is not narrowed by an outside', () => {
      const box = region({
        inside: [circleAt(0, 0, 50)],
        outside: [circleAt(0, 0, 20)],
        bounds,
      }).getBoundingBox();

      expect(box.width).toBe(100);
      expect(box.height).toBe(100);
    });

    it('collapses to zero area when the insides do not meet', () => {
      const box = region({
        inside: [circleAt(-80, 0, 10), circleAt(80, 0, 10)],
        outside: [],
        bounds,
      }).getBoundingBox();

      expect(box.width).toBe(0);
    });
  });

  describe('overlapsBox', () => {
    const ring = region({
      inside: [circleAt(0, 0, 50)],
      outside: [],
      bounds,
    });

    it('overlaps a box across its bounding box', () => {
      expect(
        ring.overlapsBox({ at: { x: 0, y: 0 }, width: 10, height: 10 }),
      ).toBe(true);
    });

    it('does not overlap a box clear of it', () => {
      expect(
        ring.overlapsBox({ at: { x: 200, y: 200 }, width: 10, height: 10 }),
      ).toBe(false);
    });
  });
});
