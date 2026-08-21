import { PluginOptions } from '@graph/plugins-shared/plugins';

import { PHANTOM_PLUGIN_ID } from './constants.ts';
import { PhantomPlugin } from './types.ts';

const layerId = `${PHANTOM_PLUGIN_ID}/createLabelThemer`;

export const createLabelThemer = (
  controls: PluginOptions<PhantomPlugin>['controls'],
  label: ({ id }: { id: string }) => string | undefined,
) => {
  const canvas = controls.surface.theme.createLayer(layerId);
  const focus = controls.focus?.theme.createLayer(layerId);

  const enable = () => {
    canvas.set('node.default.text.content', label);
    canvas.set('node.hover.text.content', label);
    focus?.set('node.focus.text.content', label);

    canvas.set('edge.default.text.content', label);
    canvas.set('edge.hover.text.content', label);
    focus?.set('edge.focus.text.content', label);
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
