import { PluginOptions } from '@graph/plugins-shared/plugins';
import { CoreNode } from '@graph/primitives/types';

import { NODE_LABEL_PLUGIN_ID } from './constants.ts';
import { NodeLabelControls, NodeLabelPlugin } from './types.ts';

const layerId = `${NODE_LABEL_PLUGIN_ID}/createLabelThemer`;

export const createLabelThemer = (
  controls: PluginOptions<NodeLabelPlugin>['controls'],
  getLabel: NodeLabelControls['get'],
) => {
  const canvas = controls.surface.theme.createLayer(layerId);
  const focus = controls.focus?.theme.createLayer(layerId);

  const label = (node: CoreNode) => getLabel(node.id);

  const enable = () => {
    canvas.set('node.default.text.content', label);
    canvas.set('node.hover.text.content', label);
    focus?.set('node.focus.text.content', label);
  };

  const disable = () => {
    canvas.removeAll();
    focus?.removeAll();
  };

  return {
    enable,
    disable,
  };
};
