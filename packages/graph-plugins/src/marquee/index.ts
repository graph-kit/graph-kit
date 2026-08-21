import { Aggregator, CanvasElement } from '@canvas/primitives/aggregator/types';
import { normalizeBoundingBox } from '@canvas/primitives/helpers';
import type { BoundingBox, Coordinate } from '@canvas/primitives/types/utility';
import type { ElementMouseEvent } from '@canvas/surface/events/index';
import { createEventHub } from '@core/events/createEventHub';
import { createThemeController } from '@core/themes/index';
import { MOUSE_BUTTONS } from '@core/utils/mouse';
import { createLifecycle } from '@graph/plugins-shared/lifecycle';
import { DeepReadonly } from 'ts-essentials';

import { ANCHOR_PLUGIN_ID } from '../anchors/constants.ts';
import { NODE_DRAG_CANVAS_ELEMENT_DATA_FIELD } from '../node-drag/constants.ts';
import { CANVAS_ELEMENT_CURSOR_FIELD_KEY } from '../surface/setupCursor.ts';
import { GraphUnderCursor } from '../surface/types.ts';
import { MARQUEE_PLUGIN_ID, MARQUEE_SHAPE_ID } from './constants.ts';
import { createMarqueeEventRegistry } from './events.ts';
import { getSelectionBox, getSurfaceArea } from './helpers.ts';
import { createMarqueeThemeOverrides } from './themes.ts';
import { MarqueePlugin } from './types.ts';

export const marquee: MarqueePlugin = ({ controls, events }) => {
  const marqueeEventRegistry = createMarqueeEventRegistry();
  const marqueeEventHub = createEventHub(marqueeEventRegistry);

  const theme = createThemeController(createMarqueeThemeOverrides());

  /*
    the drag box is an unreliable place to hang a cursor: the pointer rides its
    moving corner, where the boundary hit test is a coin flip, and while width or
    height is still zero there is no element in the aggregator to carry one at
    all. canvas.cursor resolves ahead of the element lookup, so it holds for the
    whole drag regardless
  */
  const cursorLayer = controls.surface.theme.createLayer(
    `${MARQUEE_PLUGIN_ID}/cursor`,
  );

  let marqueeBox: BoundingBox | undefined = undefined;
  let selectionBox: BoundingBox | undefined = undefined;

  /**
   * given a mouse event, engages or disengages the marquee box
   */
  const handleMarqueeEngagement = ({
    topElement,
    coords,
    event,
  }: ElementMouseEvent) => {
    if (event.button !== MOUSE_BUTTONS.left) return;
    if (!topElement) engageMarqueeBox(coords);
  };

  const engageMarqueeBox = (startingCoords: Coordinate) => {
    marqueeBox = {
      at: startingCoords,
      width: 0,
      height: 0,
    };
    marqueeEventHub.emit('onMarqueeBeginSelection', startingCoords);
  };

  const disengageMarqueeBox = () => {
    if (!marqueeBox) return;
    const finalMarqueeBox = marqueeBox;
    marqueeBox = undefined;
    marqueeEventHub.emit('onMarqueeEndSelection', finalMarqueeBox);
  };

  const updateMarqueeSelectedItems = (box: BoundingBox) => {
    const surfaceArea = getSurfaceArea(box);
    if (surfaceArea < 100) return;
    const targetedItems: string[] = [];

    for (const {
      id,
      shape,
      paintOnly,
    } of controls.surface.aggregator.aggregator()) {
      if (!controls.isNode(id) && !controls.isEdge(id)) continue;
      if (paintOnly) continue;
      const inSelectionBox = shape.overlapsBox(box);
      if (inSelectionBox) targetedItems.push(id);
    }

    controls.focus.set(targetedItems);
  };

  const updateSelectionBox = () => {
    selectionBox = getSelectionBox(controls);
  };

  const setMarqueeBoxDimensions = (
    { coords }: DeepReadonly<GraphUnderCursor>,
    consume: () => void,
  ) => {
    if (!marqueeBox) return;
    consume();

    const { x, y } = coords;
    marqueeBox.width = x - marqueeBox.at.x;
    marqueeBox.height = y - marqueeBox.at.y;
    updateMarqueeSelectedItems(marqueeBox);
  };

  const getMarqueeBoxCanvasElement = (box: BoundingBox): CanvasElement => {
    const shape = controls.surface.shapes.rect({
      id: MARQUEE_SHAPE_ID,
      ...normalizeBoundingBox(box),
      fillColor: theme._resolveToken('marquee.drag.color'),
      stroke: {
        color: theme._resolveToken('marquee.drag.border.color'),
        lineWidth: theme._resolveToken('marquee.drag.border.width'),
      },
    });

    return {
      id: MARQUEE_SHAPE_ID,
      shape,
      priority: Infinity,
    };
  };

  /*
    mousedown engages the box before the pointer has moved, so an engaged box is
    not yet a drag. either axis alone counts: a dead straight drag leaves the
    other at zero, and requiring both would drop the cursor mid gesture
  */
  const hasMarqueeBoxMoved = () =>
    !!marqueeBox && (marqueeBox.width !== 0 || marqueeBox.height !== 0);

  const addMarqueeBoxToAggregator = (aggregator: Aggregator) => {
    if (!marqueeBox) return aggregator;

    const { width, height } = marqueeBox;
    if (width === 0 || height === 0) return aggregator;

    const selectionBoxCanvasElement = getMarqueeBoxCanvasElement(marqueeBox);
    aggregator.push(selectionBoxCanvasElement);
    return aggregator;
  };

  // the box only offers up what the pointer could still reach on its own, and a paint
  // only node is out of reach however it came to be selected
  const selectableFocusedNodeIds = () => {
    const focusedIds = new Set(
      controls.focus.focusedNodes().map(({ id }) => id),
    );
    const selectable: string[] = [];
    for (const { id, paintOnly } of controls.surface.aggregator.aggregator()) {
      if (!paintOnly && focusedIds.has(id)) selectable.push(id);
    }
    return selectable;
  };

  const getSelectionBoxSchema = (box: BoundingBox): CanvasElement => {
    const id = 'selection-box';
    const shape = controls.surface.shapes.rect({
      id,
      ...box,
      fillColor: theme._resolveToken('marquee.selection.color'),
      stroke: {
        color: theme._resolveToken('marquee.selection.border.color'),
        lineWidth: theme._resolveToken('marquee.selection.border.width'),
      },
    });

    return {
      id,
      shape,
      priority: 3,
      data: {
        [NODE_DRAG_CANVAS_ELEMENT_DATA_FIELD]: selectableFocusedNodeIds(),
        [CANVAS_ELEMENT_CURSOR_FIELD_KEY]: theme._resolveToken(
          'marquee.selection.cursor',
        ),
      },
    };
  };

  const addSelectionBoxToAggregator = (aggregator: Aggregator) => {
    if (!selectionBox) return aggregator;

    const { width, height } = selectionBox;
    if (width === 0 || height === 0) return aggregator;

    const selectionBoxSchema = getSelectionBoxSchema(selectionBox);

    aggregator.push(selectionBoxSchema);
    return aggregator;
  };

  controls.surface.aggregator.transformers.push(addSelectionBoxToAggregator);
  controls.surface.aggregator.transformers.push(addMarqueeBoxToAggregator);

  const onEnable = () => {
    cursorLayer.set('canvas.cursor', () =>
      hasMarqueeBoxMoved()
        ? theme._resolveToken('marquee.drag.cursor')
        : undefined,
    );

    controls.focus.events.subscribe('onFocusChange', updateSelectionBox);

    controls.surface.events.elements.handle(
      'onMouseDown',
      handleMarqueeEngagement,
      MARQUEE_PLUGIN_ID,
    );
    controls.surface.events.elements.handle(
      'onMouseUp',
      disengageMarqueeBox,
      MARQUEE_PLUGIN_ID,
    );
    controls.surface.events.elements.handle(
      'onContextMenu',
      disengageMarqueeBox,
      MARQUEE_PLUGIN_ID,
    );

    // if mouse is held down, resize the marquee box around the cursor position
    controls.surface.events.elements.handle(
      'onElementsUnderCursorChange',
      setMarqueeBoxDimensions,
      MARQUEE_PLUGIN_ID,
      { before: [ANCHOR_PLUGIN_ID] },
    );

    events._internal.core.subscribe('onNodeMoveStream', updateSelectionBox);
  };

  const onDisable = () => {
    controls.focus.events.unsubscribe('onFocusChange', updateSelectionBox);

    controls.surface.events.elements.unhandle(
      'onMouseDown',
      handleMarqueeEngagement,
    );
    controls.surface.events.elements.unhandle('onMouseUp', disengageMarqueeBox);
    controls.surface.events.elements.unhandle(
      'onContextMenu',
      disengageMarqueeBox,
    );
    controls.surface.events.elements.unhandle(
      'onMouseMove',
      setMarqueeBoxDimensions,
    );

    events._internal.core.unsubscribe('onNodeMoveStream', updateSelectionBox);

    disengageMarqueeBox();
    cursorLayer.removeAll();
  };

  const lifecycle = createLifecycle({
    onEnable,
    onDisable,
  });

  lifecycle.enable();

  return {
    name: 'marquee',
    controls: {
      events: marqueeEventHub,
      theme,
      lifecycle,
    },
  };
};
