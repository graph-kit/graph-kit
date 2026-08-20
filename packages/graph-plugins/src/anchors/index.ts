import { CanvasElement } from '@canvas/primitives/aggregator/types';
import type { CircleSchema } from '@canvas/primitives/shapes/circle/types';
import type { WithId } from '@canvas/primitives/types/index';
import type { ElementMouseEvent } from '@canvas/surface/events/index';
import { createEventHub } from '@core/events/createEventHub';
import { createThemeController } from '@core/themes/index';
import { MOUSE_BUTTONS } from '@core/utils/mouse';
import { CoreNode } from '@graph/primitives/types';
import { DeepReadonly } from 'ts-essentials';

import { SURFACE_PLUGIN_ID } from '../surface/constants.ts';
import { CANVAS_ELEMENT_CURSOR_FIELD_KEY } from '../surface/setupCursor.ts';
import { ANCHOR_PLUGIN_ID } from './constants.ts';
import { createAnchorDragState } from './createAnchorDragState.ts';
import { createAnchorDragThemer } from './createAnchorDragThemer.ts';
import { createAnchorsEventRegistry } from './events.ts';
import { createAnchorsThemeOverrides } from './themes.ts';
import type { AnchorsPlugin, NodeAnchor } from './types.ts';

const EDGE_PREVIEW_ID = 'edge-preview';

const ANCHOR_ID_POSTFIX = 'anchor';
const isAnchor = (id: string) => id.endsWith(ANCHOR_ID_POSTFIX);

/**
 * anchors provide an additional layer of interaction by allowing nodes to spawn draggable anchors
 * when hovered over.
 *
 * helpful definitions:
 * - Anchor/Node Anchor: A draggable handle that spawns around the parent node.
 * - Parent Node: The node which anchors actively orbit around.
 * - Link Preview: The line that appears between the parent node and the anchor when the anchor is being dragged.
 */
export const anchors: AnchorsPlugin = ({ controls, events, getters }) => {
  const anchorsEventRegistry = createAnchorsEventRegistry();
  const anchorsEventHub = createEventHub(anchorsEventRegistry);

  const theme = createThemeController(createAnchorsThemeOverrides());

  let parentNode: CoreNode | undefined = undefined;

  const anchorDragState = createAnchorDragState();
  const dragCursorTheme = createAnchorDragThemer(controls, anchorDragState);

  let hoveredNodeAnchorId: NodeAnchor['id'] | undefined = undefined;

  const clearAnchorState = () => {
    parentNode = undefined;
    anchorDragState.stopDrag();
    hoveredNodeAnchorId = undefined;
  };

  const setParentNode = (nodeId: CoreNode['id']) => {
    const node = getters.getNode(nodeId);
    parentNode = node;
    updateNodeAnchors(node);
  };

  const updateHoveredNodeAnchorId = ({ topElement }: ElementMouseEvent) => {
    if (!topElement) return (hoveredNodeAnchorId = undefined);

    hoveredNodeAnchorId = topElement.id;
  };

  const getAnchorSchemas = (node: CoreNode) => {
    const color = theme._resolveToken('anchors.default.color', node);
    const focusColor = theme._resolveToken('anchors.parentFocused.color', node);

    const radius = theme._resolveToken('anchors.default.radius', node);
    const focusRadius = theme._resolveToken(
      'anchors.parentFocused.radius',
      node,
    );

    const anchorSchemas: CanvasElement[] = [];
    for (const anchor of nodeAnchors) {
      const { x, y, id } = anchor;

      const draggedAnchor = anchorDragState.getDragState()?.data;
      const isAnchorHovered = id === hoveredNodeAnchorId;
      const isAnchorDragged = id === draggedAnchor?.id;

      const isNodeFocused = controls.focus?.isFocused(node.id) ?? false;
      const isFocused = isNodeFocused || isAnchorHovered || isAnchorDragged;

      const nodeAnchorSchema: WithId<CircleSchema> = {
        id,
        at: { x, y },
        radius: isFocused ? focusRadius : radius,
        fillColor: isFocused ? focusColor : color,
      };

      if (draggedAnchor && draggedAnchor.direction === anchor.direction) {
        nodeAnchorSchema.at.x = draggedAnchor.x;
        nodeAnchorSchema.at.y = draggedAnchor.y;
      }

      const nodeAnchorShape = controls.surface.shapes.circle(nodeAnchorSchema);

      anchorSchemas.push({
        id: anchor.id,
        shape: nodeAnchorShape,
        priority: 4,
        data: {
          [CANVAS_ELEMENT_CURSOR_FIELD_KEY]: theme._resolveToken(
            'anchors.default.cursor',
            node,
          ),
        },
      });
    }

    return anchorSchemas;
  };

  /**
   * Draggable handles that spawns around the parent node.
   */
  let nodeAnchors: Readonly<NodeAnchor[]> = [];

  /**
   * updates the node anchors array with the new node anchors
   *
   * @param {CoreNode} node - the parent node of the anchor
   * @returns {void}
   */
  const updateNodeAnchors = (node: CoreNode | undefined) => {
    if (!node) return (nodeAnchors = []);
    const anchorToken = theme._resolveToken;
    const canvasToken = controls.surface.theme._resolveToken;
    const focusToken = controls.focus?.theme._resolveToken;

    const isNodeFocused = controls.focus?.isFocused(node.id) ?? false;

    const anchorBaseRadius = anchorToken('anchors.default.radius', node);
    const anchorFocusRadius = anchorToken('anchors.parentFocused.radius', node);

    const anchorRadius = isNodeFocused ? anchorFocusRadius : anchorBaseRadius;

    const nodeBaseSize = canvasToken('node.default.size', node);
    const nodeFocusSize = focusToken?.('node.focus.size', node) ?? nodeBaseSize;

    const nodeSize = isNodeFocused ? nodeBaseSize : nodeFocusSize;

    const nodeBaseBorderWidth = canvasToken('node.default.border.width', node);
    const nodeFocusBorderWidth =
      focusToken?.('node.focus.border.width', node) ?? nodeBaseBorderWidth;

    const nodeBorderWidth = isNodeFocused
      ? nodeFocusBorderWidth
      : nodeBaseBorderWidth;

    const offset = nodeSize - anchorRadius / 3 + nodeBorderWidth / 2;
    const nodePosition = controls.positions.get(node.id);
    nodeAnchors = [
      {
        id: 'n-' + ANCHOR_ID_POSTFIX,
        x: nodePosition.x,
        y: nodePosition.y - offset,
        direction: 'north',
      },
      {
        id: 'e-' + ANCHOR_ID_POSTFIX,
        x: nodePosition.x + offset,
        y: nodePosition.y,
        direction: 'east',
      },
      {
        id: 's-' + ANCHOR_ID_POSTFIX,
        x: nodePosition.x,
        y: nodePosition.y + offset,
        direction: 'south',
      },
      {
        id: 'w-' + ANCHOR_ID_POSTFIX,
        x: nodePosition.x - offset,
        y: nodePosition.y,
        direction: 'west',
      },
    ] as const;
  };

  /**
   * the anchor at the given event location
   */
  const getAnchor = ({ topElement, event }: ElementMouseEvent) => {
    if (event.button !== MOUSE_BUTTONS.left) return;
    if (!topElement || !isAnchor(topElement.id)) return;
    const { id: anchorId } = topElement;
    return nodeAnchors.find((anchor) => anchor.id === anchorId);
  };

  const resolveEdgePreviewCanvasElement = (_: CanvasElement[]) => {
    const draggedAnchor = anchorDragState.getDragState()?.data;
    if (!parentNode || !draggedAnchor) return;
    const { x, y } = draggedAnchor;
    const start = controls.positions.get(parentNode.id);
    const end = { x, y };

    const anchorToken = theme._resolveToken;

    const isFocused = controls.focus?.isFocused(parentNode.id) ?? false;

    const baseColor = anchorToken(
      'anchors.edge.preview.default.color',
      parentNode,
      draggedAnchor,
    );

    const focusColor = anchorToken(
      'anchors.edge.preview.parentFocused.color',
      parentNode,
      draggedAnchor,
    );

    const color = isFocused ? focusColor : baseColor;

    const baseWidth = anchorToken(
      'anchors.edge.preview.default.width',
      parentNode,
      draggedAnchor,
    );

    const focusWidth = anchorToken(
      'anchors.edge.preview.parentFocused.width',
      parentNode,
      draggedAnchor,
    );

    const width = isFocused ? focusWidth : baseWidth;

    const shape = controls.surface.shapes.line({
      id: EDGE_PREVIEW_ID,
      start,
      end,
      fillColor: color,
      lineWidth: width,
    });

    const element: CanvasElement = {
      id: EDGE_PREVIEW_ID,
      priority: controls.surface.getNodePriority()(parentNode.id) - 0.001,
      shape,
    };

    return element;
  };

  /**
   * checks if the users' cursor is hovering directly above a node, if so, sets it as parent
   */
  const checkForParentNodeUpdate = () => {
    const draggedAnchor = anchorDragState.getDragState()?.data;
    if (draggedAnchor) return;

    const { topElement } = controls.surface.elementsUnderCursor;

    if (!topElement) return clearAnchorState();

    if (isAnchor(topElement.id)) return;
    if (!controls.isNode(topElement.id)) return clearAnchorState();

    const newParentNode = getters.getNode(topElement.id);

    if (newParentNode.id === parentNode?.id) return;
    setParentNode(newParentNode.id);
  };

  const clearAnchorStateIfParentRemoved = (
    nodeIds: readonly CoreNode['id'][],
  ) => {
    if (parentNode && nodeIds.includes(parentNode.id)) {
      clearAnchorState();
    }
  };

  const setCurrentlyDraggingAnchor = (ev: ElementMouseEvent) => {
    if (!parentNode) return;
    /**
     * TODO shouldn't getAnchor be unnecessary here because the top item in this event should
     * point to the anchor itself?
     */
    const anchor = getAnchor(ev);
    if (!anchor) return;
    anchorDragState.startDrag(ev.coords, anchor);
    anchorsEventHub.emit('onNodeAnchorDragStart', parentNode, anchor);
  };

  const updateCurrentlyDraggingAnchorPosition = ({
    coords,
  }: ElementMouseEvent) => anchorDragState.applyMove(coords);

  /**
   * drops the active anchor and triggers onNodeAnchorDrop event
   */
  const dropAnchor = () => {
    const draggedAnchor = anchorDragState.getDragState()?.data;
    if (!draggedAnchor) return;
    else if (!parentNode) throw new Error('active anchor without parent node');
    anchorsEventHub.emit('onNodeAnchorDrop', parentNode, draggedAnchor);
    clearAnchorState();
  };

  const insertAnchorsIntoAggregator = (aggregator: CanvasElement[]) => {
    if (!parentNode) return aggregator;
    const anchors = getAnchorSchemas(parentNode);
    for (const anchor of anchors) aggregator.push(anchor);
    return aggregator;
  };

  const insertLinkPreviewIntoAggregator = (aggregator: CanvasElement[]) => {
    const draggedAnchor = anchorDragState.getDragState()?.data;
    if (!parentNode || !draggedAnchor) return aggregator;

    const linkPreviewCanvasElement =
      resolveEdgePreviewCanvasElement(aggregator);
    if (!linkPreviewCanvasElement) return aggregator;

    aggregator.push(linkPreviewCanvasElement);
    return aggregator;
  };

  controls.surface.aggregator.transformers.push(insertAnchorsIntoAggregator);
  controls.surface.aggregator.transformers.push(
    insertLinkPreviewIntoAggregator,
  );

  const consumeOnElementHoverEvent = (
    _: DeepReadonly<CanvasElement> | undefined,
    __: DeepReadonly<CanvasElement> | undefined,
    consume: () => void,
  ) => {
    if (anchorDragState.isDragging()) consume();
  };

  const enable = () => {
    events.handle(
      'onNodesRemoved',
      clearAnchorStateIfParentRemoved,
      ANCHOR_PLUGIN_ID,
    );
    events._internal.core.handle(
      'onNodeMoveStreamStart',
      clearAnchorState,
      ANCHOR_PLUGIN_ID,
    );

    // when the user is mousing over the canvas. checks if a node is under the cursor
    // to set the anchors on. onGraphUnderCursorChange because onMouseMove doesn't capture
    // the cases where the canvas state changes under the cursor while the cursor is
    // stationary, ie node being added via double click
    controls.surface.events.elements.handle(
      'onElementsUnderCursorChange',
      checkForParentNodeUpdate,
      ANCHOR_PLUGIN_ID,
    );

    // when a node is finished dragging, set the dropped node as anchor parent
    controls.surface.events.elements.handle(
      'onMouseUp',
      checkForParentNodeUpdate,
      ANCHOR_PLUGIN_ID,
    );

    // if an anchor is being dragged, update its position
    controls.surface.events.elements.handle(
      'onMouseMove',
      updateCurrentlyDraggingAnchorPosition,
      ANCHOR_PLUGIN_ID,
    );

    // scans the canvas when the cursor is moving and sets the hovered node anchor state
    controls.surface.events.elements.handle(
      'onMouseMove',
      updateHoveredNodeAnchorId,
      ANCHOR_PLUGIN_ID,
    );

    // picks up the node anchor to begin drag
    controls.surface.events.elements.handle(
      'onMouseDown',
      setCurrentlyDraggingAnchor,
      ANCHOR_PLUGIN_ID,
    );

    // drop the node anchor being dragged
    controls.surface.events.elements.handle(
      'onMouseUp',
      dropAnchor,
      ANCHOR_PLUGIN_ID,
    );

    // prevents fast mouse movement from updating the hovered element to the destination node mid-drag
    controls.surface.events.elements.handle(
      'onHoveredElementChange',
      consumeOnElementHoverEvent,
      ANCHOR_PLUGIN_ID,
      {
        before: [SURFACE_PLUGIN_ID],
      },
    );

    dragCursorTheme.enable();
  };

  const disable = () => {
    events.unhandle('onNodesRemoved', clearAnchorStateIfParentRemoved);
    events._internal.core.unhandle('onNodeMoveStreamStart', clearAnchorState);
    controls.surface.events.elements.unhandle(
      'onMouseUp',
      checkForParentNodeUpdate,
    );
    controls.surface.events.elements.unhandle(
      'onElementsUnderCursorChange',
      checkForParentNodeUpdate,
    );
    controls.surface.events.elements.unhandle(
      'onMouseMove',
      updateCurrentlyDraggingAnchorPosition,
    );
    controls.surface.events.elements.unhandle(
      'onMouseMove',
      updateHoveredNodeAnchorId,
    );
    controls.surface.events.elements.unhandle(
      'onMouseDown',
      setCurrentlyDraggingAnchor,
    );
    controls.surface.events.elements.unhandle('onMouseUp', dropAnchor);
    controls.surface.events.elements.unhandle(
      'onHoveredElementChange',
      consumeOnElementHoverEvent,
    );
    clearAnchorState();
    dragCursorTheme.disable();
  };

  enable();

  return {
    name: 'anchors',
    controls: {
      events: anchorsEventHub,
      lifecycle: {
        enable,
        disable,
      },
      theme,
    },
  };
};
