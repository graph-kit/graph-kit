import { ThemeController } from '@core/themes/index';
import { PluginOptions } from '@graph/plugins-shared/plugins';

import { MARQUEE_PLUGIN_ID } from './constants.ts';
import { MarqueeThemes } from './themes.ts';
import { MarqueePlugin } from './types.ts';

const layerId = `${MARQUEE_PLUGIN_ID}/createCursorThemer`;

export const createCursorThemer = (
  controls: PluginOptions<MarqueePlugin>['controls'],
  theme: ThemeController<MarqueeThemes>,
  isDragging: () => boolean,
) => {
  // canvas.cursor, not element data: the pointer rides the box's corner, right on
  // the hit test boundary
  const canvas = controls.surface.theme.createLayer(layerId);

  const dragCursor = () =>
    isDragging() ? theme._resolveToken('marquee.drag.cursor') : undefined;

  const enable = () => {
    canvas.set('canvas.cursor', dragCursor);
  };

  const disable = () => {
    canvas.removeAll();
  };

  return {
    enable,
    disable,
  };
};
