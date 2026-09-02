import colors, { Color } from '@core/utils/colors';
import { PluginOptions } from '@graph/plugins-shared/plugins';
import { CoreEdge, CoreNode } from '@graph/primitives/types';
import Fraction from 'fraction.js';
import tinycolor from 'tinycolor2';

import { NodeAnchor } from '../anchors/types.ts';
import { INTERACTIVE_PLUGIN_ID } from './constants.ts';
import { InteractivePlugin } from './types.ts';

const layerId = `${INTERACTIVE_PLUGIN_ID}/createDropTargetPreview`;

const DROP_PREVIEW_EDGE_ID = `${INTERACTIVE_PLUGIN_ID}/drop-preview-edge`;

const DROP_TARGET_BORDER_COLOR = colors.AMBER_500;

const ACTIVE_DROP_TARGET_BORDER_COLOR = colors.RED_700;

const DROP_PREVIEW_EDGE_ALPHA = 0.4;

const fade = (color: Color, alpha: number) =>
  tinycolor(color).setAlpha(alpha).toHex8String();

export const createDropTargetPreview = (
  controls: PluginOptions<InteractivePlugin>['controls'],
  canConnect: (sourceNodeId: string, targetNodeId: string) => boolean,
  newEdgeWeight: () => Fraction,
) => {
  const surface = controls.surface.theme.createLayer(layerId);
  const focus = controls.focus?.theme.createLayer(layerId);
  const anchors = controls.anchors?.theme.createLayer(layerId);

  let anchorParentNodeId: CoreNode['id'] | undefined = undefined;

  let previewedTargetNodeId: CoreNode['id'] | undefined = undefined;

  const liveAnchorParentNodeId = () => {
    if (!anchorParentNodeId) return;
    if (controls.anchors?.parentNodeId() !== anchorParentNodeId) return;
    return anchorParentNodeId;
  };

  /** the same node the drop handler would connect to, so the preview cannot disagree with it */
  const nodeIdUnderAnchor = () => {
    const { elements } = controls.surface.elementsUnderCursor;
    return elements.findLast((element) => controls.isNode(element.id))?.id;
  };

  const dropTargetBorderColor = (node: CoreNode) => {
    const sourceNodeId = liveAnchorParentNodeId();
    if (!sourceNodeId) return;
    if (!canConnect(sourceNodeId, node.id)) return;
    return node.id === nodeIdUnderAnchor()
      ? ACTIVE_DROP_TARGET_BORDER_COLOR
      : DROP_TARGET_BORDER_COLOR;
  };

  const previewEdgeColor = (edge: CoreEdge, resolveUnderneath: () => Color) => {
    if (edge.id !== DROP_PREVIEW_EDGE_ID) return;
    return fade(resolveUnderneath(), DROP_PREVIEW_EDGE_ALPHA);
  };

  const anchorEdgePreviewColor = (
    _node: CoreNode,
    _anchor: NodeAnchor,
    resolveUnderneath: () => Color,
  ) => {
    if (!previewedTargetNodeId) return;
    return fade(resolveUnderneath(), 0);
  };

  const removePreviewEdge = () => {
    if (!previewedTargetNodeId) return;
    previewedTargetNodeId = undefined;
    controls.phantom?.removeEdge(DROP_PREVIEW_EDGE_ID);
  };

  /** the node a release right now would connect to, if there is a legal one under the anchor */
  const activeDropTargetNodeId = () => {
    const sourceNodeId = liveAnchorParentNodeId();
    if (!sourceNodeId) return;
    const targetNodeId = nodeIdUnderAnchor();
    if (!targetNodeId) return;
    if (!canConnect(sourceNodeId, targetNodeId)) return;
    return targetNodeId;
  };

  const syncPreviewEdge = () => {
    const phantom = controls.phantom;
    if (!phantom) return;

    const targetNodeId = activeDropTargetNodeId();
    if (targetNodeId === previewedTargetNodeId) return;

    removePreviewEdge();
    if (!targetNodeId) return;

    const sourceNodeId = liveAnchorParentNodeId();
    if (!sourceNodeId) return;

    previewedTargetNodeId = targetNodeId;

    phantom.addEdge({
      id: DROP_PREVIEW_EDGE_ID,
      source: sourceNodeId,
      target: targetNodeId,
      label: newEdgeWeight().toFraction(),
    });
  };

  const startDrag = (parentNode: CoreNode) =>
    (anchorParentNodeId = parentNode.id);

  const stopDrag = () => {
    anchorParentNodeId = undefined;
    removePreviewEdge();
  };

  const onEnable = () => {
    surface.set('node.default.border.color', dropTargetBorderColor);
    surface.set('node.hover.border.color', dropTargetBorderColor);
    focus?.set('node.focus.border.color', dropTargetBorderColor);

    surface.set('edge.default.color', previewEdgeColor);
    surface.set('edge.default.text.color', previewEdgeColor);
    surface.set('edge.hover.color', previewEdgeColor);
    surface.set('edge.hover.text.color', previewEdgeColor);

    anchors?.set('anchors.edge.preview.default.color', anchorEdgePreviewColor);
    anchors?.set(
      'anchors.edge.preview.parentFocused.color',
      anchorEdgePreviewColor,
    );

    controls.anchors?.events.subscribe('onNodeAnchorDragStart', startDrag);
    controls.anchors?.events.subscribe('onNodeAnchorDrop', stopDrag);
    controls.surface.events.elements.handle(
      'onElementsUnderCursorChange',
      syncPreviewEdge,
      INTERACTIVE_PLUGIN_ID,
    );
  };

  const onDisable = () => {
    surface.removeAll();
    focus?.removeAll();
    anchors?.removeAll();

    controls.anchors?.events.unsubscribe('onNodeAnchorDragStart', startDrag);
    controls.anchors?.events.unsubscribe('onNodeAnchorDrop', stopDrag);
    controls.surface.events.elements.unhandle(
      'onElementsUnderCursorChange',
      syncPreviewEdge,
    );

    stopDrag();
  };

  return {
    enable: onEnable,
    disable: onDisable,
  };
};
