import { CURSOR } from '@core/utils/cursor';
import { DragStateControls } from '@graph/plugins-shared/drag';
import { PluginOptions } from '@graph/plugins-shared/plugins';

import { NODE_DRAG_PLUGIN_ID } from './constants.ts';
import { NodeDragPlugin, NodeIdDragState } from './types.ts';

const layerId = `${NODE_DRAG_PLUGIN_ID}/createDragThemer`;

export const createDragThemer = (
  controls: PluginOptions<NodeDragPlugin>['controls'],
  dragState: DragStateControls<NodeIdDragState>,
) => {
  const canvas = controls.canvas.theme.createLayer(layerId);
  const focus = controls.focus?.theme.createLayer(layerId);
  const marquee = controls.marquee?.theme.createLayer(layerId);

  const globalGrabbing = () =>
    dragState.isDragging() ? CURSOR.GRABBING : undefined;

  const enable = () => {
    canvas.set('canvas.cursor', globalGrabbing);
    canvas.set('node.default.cursor', CURSOR.GRAB);
    focus?.set('node.focus.cursor', CURSOR.GRAB);
    marquee?.set('marquee.selection.cursor', CURSOR.GRAB);
  };

  const disable = () => {
    canvas.removeAll();
    focus?.removeAll();
    marquee?.removeAll();
  };

  return {
    enable,
    disable,
  };
};
