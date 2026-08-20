import { CanvasElement } from '@canvas/primitives/aggregator/types';
import { createMockEventHub } from '@core/events/testing/createMockEventHub';
import { describe, expect, it, vi } from 'vitest';

import { createCanvasEventRegistry } from './events.ts';
import { setupOnHoveredElementChangeEvent } from './setupHoveredElement.ts';

const makeElement = (id: string): CanvasElement => ({ id }) as CanvasElement;

const makeEvents = () => createMockEventHub(createCanvasEventRegistry());

const triggerCursorChange = (
  events: ReturnType<typeof makeEvents>,
  elements: CanvasElement[],
) => {
  events.emit('onGraphUnderCursorChange', {
    elements,
    topElement: elements.at(-1),
    position: { x: 0, y: 0 },
  } as any);
};

describe(setupOnHoveredElementChangeEvent, () => {
  it('starts as undefined', () => {
    const events = makeEvents();
    const { value } = setupOnHoveredElementChangeEvent(events);
    expect(value).toBeUndefined();
  });

  it('sets the hovered element to the topmost element', () => {
    const events = makeEvents();
    const state = setupOnHoveredElementChangeEvent(events);
    const el = makeElement('a');

    triggerCursorChange(events, [el]);
    expect(state.value?.id).toBe('a');
  });

  it('updates when the hovered element changes', () => {
    const events = makeEvents();
    const state = setupOnHoveredElementChangeEvent(events);

    triggerCursorChange(events, [makeElement('a')]);
    triggerCursorChange(events, [makeElement('b')]);
    expect(state.value?.id).toBe('b');
  });

  it('clears to undefined when no elements are under the cursor', () => {
    const events = makeEvents();
    const state = setupOnHoveredElementChangeEvent(events);

    triggerCursorChange(events, [makeElement('a')]);
    triggerCursorChange(events, []);
    expect(state.value).toBeUndefined();
  });

  describe('onHoveredElementChange', () => {
    it('is triggered when moving from undefined to an element', () => {
      const events = makeEvents();
      setupOnHoveredElementChangeEvent(events);
      const el = makeElement('a');

      triggerCursorChange(events, [el]);
      expect(events.emit).toHaveBeenCalledWith(
        'onHoveredElementChange',
        el,
        undefined,
      );
    });

    it('is triggered when moving from one element to another', () => {
      const events = makeEvents();
      setupOnHoveredElementChangeEvent(events);
      const a = makeElement('a');
      const b = makeElement('b');

      triggerCursorChange(events, [a]);
      triggerCursorChange(events, [b]);
      expect(events.emit).toHaveBeenLastCalledWith(
        'onHoveredElementChange',
        b,
        a,
      );
    });

    it('is triggered when the cursor leaves all elements', () => {
      const events = makeEvents();
      setupOnHoveredElementChangeEvent(events);
      const el = makeElement('a');

      triggerCursorChange(events, [el]);
      triggerCursorChange(events, []);
      expect(events.emit).toHaveBeenLastCalledWith(
        'onHoveredElementChange',
        undefined,
        el,
      );
    });

    it('is not triggered when the same element remains on top', () => {
      const events = makeEvents();
      setupOnHoveredElementChangeEvent(events);
      const el = makeElement('a');

      triggerCursorChange(events, [el]);
      vi.clearAllMocks();
      triggerCursorChange(events, [el]);

      expect(events.emit).not.toHaveBeenCalledWith(
        'onHoveredElementChange',
        expect.anything(),
        expect.anything(),
      );
    });

    it('is not triggered when cursor stays empty', () => {
      const events = makeEvents();
      setupOnHoveredElementChangeEvent(events);

      triggerCursorChange(events, []);
      triggerCursorChange(events, []);

      expect(events.emit).not.toHaveBeenCalledWith(
        'onHoveredElementChange',
        expect.anything(),
        expect.anything(),
      );
    });
  });
});
