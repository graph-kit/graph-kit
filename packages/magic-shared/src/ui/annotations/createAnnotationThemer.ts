import { CURSOR } from '@core/utils/cursor';

import { ComputedRef } from 'vue';

import { Graph } from '../../graph/types.ts';

export const createAnnotationThemer = (
  canvas: Graph['canvas'],
  hideCursor: ComputedRef<boolean>,
) => {
  const { set, removeAll } = canvas.theme.createLayer('product/annotations');

  const activate = () => {
    set('canvas.cursor', () =>
      hideCursor.value ? CURSOR.NONE : CURSOR.CROSSHAIR,
    );
  };

  return {
    activate,
    deactivate: removeAll,
  };
};
