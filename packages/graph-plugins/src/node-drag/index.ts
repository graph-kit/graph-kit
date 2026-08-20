import type { ElementMouseEvent } from '@canvas/surface/events/index';
import { createEventHub } from '@core/events/createEventHub';
import { nullThrows } from '@core/utils/assert';
import { devAssert, devWarning } from '@core/utils/debugging';
import { MOUSE_BUTTONS } from '@core/utils/mouse';
import { NodePositionStreamControls } from '@graph/core/positions/types';
import { createDragState } from '@graph/plugins-shared/drag';
import { DeepReadonly } from 'ts-essentials';

import { ANCHOR_PLUGIN_ID } from '../anchors/constants.ts';
import { GraphUnderCursor } from '../surface/types.ts';
import {
  NODE_DRAG_CANVAS_ELEMENT_DATA_FIELD,
  NODE_DRAG_PLUGIN_ID,
} from './constants.ts';
import { createDragThemer } from './createDragThemer.ts';
import { createNodeDragEventRegistry } from './events.ts';
import { DEFAULT_NODE_DRAG_OPTIONS, NodeDragOptions } from './options.ts';
import { NodeDragPlugin, NodeIdDragState } from './types.ts';
import { validateNodeIds } from './validateNodeIds.ts';

export const nodeDrag =
  (options: Partial<NodeDragOptions>): NodeDragPlugin =>
  ({ controls, events, getters }) => {
    const optionsWithDefaults = {
      ...DEFAULT_NODE_DRAG_OPTIONS,
      ...options,
    };

    const captureHistorySnapshot = () => {
      const { recordHistory } = optionsWithDefaults;
      if (!recordHistory) return;
      controls.history?.captureSnapshot();
    };

    const nodeDragEventRegistry = createNodeDragEventRegistry();
    const nodeDragEventHub = createEventHub(nodeDragEventRegistry);

    const dragState = createDragState<NodeIdDragState>();
    let nodePositionStream: NodePositionStreamControls | undefined;

    const beginDrag = (
      { topElement, coords, event }: ElementMouseEvent,
      consume: () => void,
    ) => {
      if (event.button !== MOUSE_BUTTONS.left) return;

      if (!topElement) return;

      const nodeIdsToDrag = [];

      if (controls.isNode(topElement.id)) {
        nodeIdsToDrag.push(topElement.id);
      }

      const nodeIds = topElement.data?.[NODE_DRAG_CANVAS_ELEMENT_DATA_FIELD];
      if (validateNodeIds(nodeIds)) {
        nodeIdsToDrag.push(...nodeIds);
      } else if (nodeIds !== undefined) {
        devWarning('node drag expected array of node ids: got', nodeIds);
      }

      // a selection can name a node that has since left the graph, so what is carried is
      // what is still here rather than whatever was selected
      const liveNodeIdsToDrag = nodeIdsToDrag.filter((nodeId) =>
        controls.isNode(nodeId),
      );
      if (liveNodeIdsToDrag.length === 0) return;

      consume();

      const nodes = liveNodeIdsToDrag.map((nodeId) => getters.getNode(nodeId));

      devAssert(
        !nodePositionStream,
        'node drag started while the previous drag still had an open position stream, meaning its mouse release was missed',
      );
      nodePositionStream?.stop();

      dragState.startDrag(coords, { nodeIds: liveNodeIdsToDrag });
      nodePositionStream = controls.positions.createStream();
      nodeDragEventHub.emit('onNodeDragStart', nodes);
    };

    const drop = () => {
      const data = dragState.stopDrag();
      if (!data) return;
      const stream = nullThrows(
        nodePositionStream,
        'node position stream controls undefined',
      );
      stream.stop();
      nodePositionStream = undefined;
      nodeDragEventHub.emit(
        'onNodeDrop',
        data.nodeIds
          .filter((nodeId) => controls.isNode(nodeId))
          .map((nodeId) => getters.getNode(nodeId)),
      );
      captureHistorySnapshot();
    };

    /**
     * A drag ends as soon as any of its nodes is deleted, since finishing with the
     * survivors would drop a different selection than the user picked up.
     */
    const abortDragOnTamper = () => {
      const active = dragState.getDragState();
      if (!active) return;
      const intact = active.data.nodeIds.every((nodeId) =>
        controls.isNode(nodeId),
      );
      if (intact) return;
      drop();
    };

    const drag = (
      { coords }: DeepReadonly<GraphUnderCursor>,
      consume: () => void,
    ) => {
      // just in case a removal happened that never triggered onElementsRemoved
      abortDragOnTamper();

      const dragData = dragState.applyMove(coords);
      if (!dragData) return;

      const {
        data: { nodeIds },
        deltas: { dx, dy },
      } = dragData;

      consume();

      if (!dx && !dy) return;

      const nodes = nodeIds.map((nodeId) => getters.getNode(nodeId));

      const stream = nullThrows(
        nodePositionStream,
        'node position stream controls undefined',
      );

      stream.setMany(
        nodes.map((n) => ({
          nodeId: n.id,
          update: (pos) => ({ x: pos.x + dx, y: pos.y + dy }),
        })),
      );
    };

    const cursorTheme = createDragThemer(controls, dragState);

    const enable = () => {
      controls.surface.events.elements.handle(
        'onMouseDown',
        beginDrag,
        NODE_DRAG_PLUGIN_ID,
        {
          before: [ANCHOR_PLUGIN_ID],
        },
      );
      controls.surface.events.elements.handle(
        'onMouseUp',
        drop,
        NODE_DRAG_PLUGIN_ID,
        {
          before: [ANCHOR_PLUGIN_ID],
        },
      );
      controls.surface.events.elements.handle(
        'onElementsUnderCursorChange',
        drag,
        NODE_DRAG_PLUGIN_ID,
        {
          before: [ANCHOR_PLUGIN_ID],
        },
      );
      events.subscribe('onElementsRemoved', abortDragOnTamper);
      cursorTheme.enable();
    };

    const disable = () => {
      controls.surface.events.elements.unhandle('onMouseDown', beginDrag);
      controls.surface.events.elements.unhandle('onMouseUp', drop);
      controls.surface.events.elements.unhandle(
        'onElementsUnderCursorChange',
        drag,
      );
      events.unsubscribe('onElementsRemoved', abortDragOnTamper);
      cursorTheme.disable();
      drop();
    };

    enable();

    return {
      name: 'nodeDrag',
      controls: {
        events: nodeDragEventHub,
        lifecycle: {
          enable,
          disable,
        },
      },
    };
  };
