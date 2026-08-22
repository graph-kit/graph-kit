import { createAggregator } from '@canvas/primitives/aggregator/index';
import type { CanvasElement } from '@canvas/primitives/aggregator/types';
import { createEventHub } from '@core/events/createEventHub';
import { describe, expect, it, vi } from 'vitest';

import { ref } from 'vue';

import { createElementsUnderCursor } from './elements.ts';

const makeElement = (id: string): CanvasElement =>
  ({ id, priority: 0 }) as CanvasElement;

/**
 * a real aggregator, since the tracking hangs off its onDraw, with the hit test
 * stubbed so a test can say what is under the cursor without building shapes
 */
const setup = () => {
  const renderer = {
    drawGroup: vi.fn(),
    beginFrame: vi.fn(),
    endFrame: vi.fn(),
  };
  const aggregator = createAggregator(renderer);

  let underCursor: CanvasElement[] = [];
  aggregator.elementsAt = () => underCursor;

  const cursorCoordinates = ref({ x: 0, y: 0 });
  const canvasEvents = createEventHub({
    onClick: new Set(),
    onMouseDown: new Set(),
    onMouseMove: new Set(),
    onDblClick: new Set(),
    onContextMenu: new Set(),
    onWheel: new Set(),
    onFocus: new Set(),
    onBlur: new Set(),
  } as any);
  const domEvents = createEventHub({
    onClick: new Set(),
    onMouseUp: new Set(),
  } as any);

  const tracked = createElementsUnderCursor({
    aggregator,
    cursorCoordinates,
    toWorldCoordinates: () => cursorCoordinates.value,
    canvasEvents: canvasEvents as any,
    domEvents: domEvents as any,
  });

  const ctx = {} as CanvasRenderingContext2D;

  return {
    ...tracked,
    cursorCoordinates,
    /** puts elements under the cursor and runs the frame that picks them up */
    hover: (elements: CanvasElement[]) => {
      underCursor = elements;
      aggregator.draw(ctx);
    },
  };
};

describe(createElementsUnderCursor, () => {
  it('starts with nothing under the cursor', () => {
    const { elementsUnderCursor } = setup();
    expect(elementsUnderCursor.elements).toEqual([]);
    expect(elementsUnderCursor.topElement).toBeUndefined();
  });

  it('reports the topmost element as hovered', () => {
    const { elementsUnderCursor, hover } = setup();
    hover([makeElement('a'), makeElement('b')]);
    expect(elementsUnderCursor.topElement?.id).toBe('b');
  });

  it('clears when nothing is under the cursor', () => {
    const { elementsUnderCursor, hover } = setup();
    hover([makeElement('a')]);
    hover([]);
    expect(elementsUnderCursor.topElement).toBeUndefined();
  });

  describe('onElementsUnderCursorChange', () => {
    it('is triggered when the set under the cursor changes', () => {
      const { events, hover } = setup();
      const callback = vi.fn();
      events.subscribe('onElementsUnderCursorChange', callback);

      hover([makeElement('a')]);
      expect(callback).toHaveBeenCalledOnce();
    });

    it('is not triggered on a frame that changes nothing', () => {
      const { events, hover } = setup();
      hover([makeElement('a')]);

      const callback = vi.fn();
      events.subscribe('onElementsUnderCursorChange', callback);
      hover([makeElement('a')]);
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('onHoveredElementChange', () => {
    it('is triggered when moving from nothing to an element', () => {
      const { events, hover } = setup();
      const callback = vi.fn();
      events.subscribe('onHoveredElementChange', callback);

      hover([makeElement('a')]);
      expect(callback).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({ id: 'a' }),
        undefined,
      );
    });

    it('carries the element it replaced', () => {
      const { events, hover } = setup();
      hover([makeElement('a')]);

      const callback = vi.fn();
      events.subscribe('onHoveredElementChange', callback);
      hover([makeElement('b')]);
      expect(callback).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({ id: 'b' }),
        expect.objectContaining({ id: 'a' }),
      );
    });

    it('is not triggered when only the elements beneath the top one change', () => {
      const { events, hover } = setup();
      hover([makeElement('a'), makeElement('top')]);

      const callback = vi.fn();
      events.subscribe('onHoveredElementChange', callback);
      hover([makeElement('b'), makeElement('top')]);
      expect(callback).not.toHaveBeenCalled();
    });

    it('is triggered with undefined once nothing is under the cursor', () => {
      const { events, hover } = setup();
      hover([makeElement('a')]);

      const callback = vi.fn();
      events.subscribe('onHoveredElementChange', callback);
      hover([]);
      expect(callback).toHaveBeenCalledExactlyOnceWith(
        undefined,
        expect.objectContaining({ id: 'a' }),
      );
    });
  });
});
