import type { CanvasElement } from '@canvas/primitives/aggregator/types';
import type {
  ElementMouseEvent as CanvasGraphMouseEvent,
  ElementsUnderCursor,
} from '@canvas/surface/events/index';
import { EventMapToEventRegistry } from '@core/events/types';
import { DeepReadonly } from 'ts-essentials';

/**
 * a standard mouse event along with extra graph related info
 * regarding the mouse position
 */
export type { CanvasGraphMouseEvent };

/** every canvas event that is a mouse event the surface already resolved to elements */
export const MOUSE_EVENT_NAMES = [
  'onClick',
  'onMouseDown',
  'onMouseUp',
  'onMouseMove',
  'onDblClick',
  'onContextMenu',
] as const;

export type MouseEventName = (typeof MOUSE_EVENT_NAMES)[number];

export type CanvasEventMap = {
  /**
   * when the canvas is clicked on (proxies native dom event)
   */
  onClick: (ev: CanvasGraphMouseEvent) => void;
  /**
   * when the user clicks the mouse button on the canvas (proxies native dom event)
   */
  onMouseDown: (ev: CanvasGraphMouseEvent) => void;
  /**
   * when the user releases the mouse button on the canvas (proxies native dom event)
   */
  onMouseUp: (ev: CanvasGraphMouseEvent) => void;
  /**
   * when the user moves the mouse on the canvas (proxies native dom event)
   */
  onMouseMove: (ev: CanvasGraphMouseEvent) => void;
  /**
   * when the canvas is double clicked on (proxies native dom event)
   */
  onDblClick: (ev: CanvasGraphMouseEvent) => void;
  /**
   * when the canvas is right clicked on (proxies native dom event)
   */
  onContextMenu: (ev: CanvasGraphMouseEvent) => void;

  /**
   * when a key is pressed down on the canvas (proxies native dom event)
   */
  onKeyDown: (ev: KeyboardEvent) => void;
  /**
   * when a key is released on the canvas (proxies native dom event)
   */
  onKeyUp: (ev: KeyboardEvent) => void;

  /**
   * after the canvas is repainted
   *
   * **WARNING** items drawn to the canvas using ctx won't be tied to graphs internal state.
   * see {@link graph.canvas.aggregator | `aggregator`} if you need drawn item to integrate with graph APIs
   */
  onDraw: (ctx: CanvasRenderingContext2D) => void;

  /**
   * right after the canvas is cleared and right before it is repainted
   *
   * **WARNING** items drawn to the canvas using ctx won't be tied to graphs internal state.
   * see {@link graph.canvas.aggregator | `aggregator`} if you need drawn item to integrate with graph APIs
   */
  onBeforeDraw: (ctx: CanvasRenderingContext2D) => void;

  onGraphUnderCursorChange: (data: DeepReadonly<ElementsUnderCursor>) => void;
  onHoveredElementChange: (
    newElement: DeepReadonly<CanvasElement> | undefined,
    oldElement: DeepReadonly<CanvasElement> | undefined,
  ) => void;
};

type CanvasEventRegistry = EventMapToEventRegistry<CanvasEventMap>;

export const createCanvasEventRegistry = (): CanvasEventRegistry => ({
  onClick: new Set(),
  onMouseDown: new Set(),
  onMouseUp: new Set(),
  onMouseMove: new Set(),
  onDblClick: new Set(),
  onContextMenu: new Set(),

  onKeyDown: new Set(),
  onKeyUp: new Set(),

  onBeforeDraw: new Set(),
  onDraw: new Set(),

  onGraphUnderCursorChange: new Set(),
  onHoveredElementChange: new Set(),
});
