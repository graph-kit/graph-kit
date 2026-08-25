import tinycolor from 'tinycolor2';

import { AutoAnimateTimeline } from '../types.ts';

export const circleRemove: AutoAnimateTimeline<'circle'> = {
  forShapes: ['circle'],
  easing: { radius: 'in-out' },
  keyframes: [
    {
      progress: 0,
      properties: {
        radius: (r) => r,
      },
    },
    {
      progress: 1,
      properties: {
        radius: 0,
        textArea: (ta) => ({
          id: ta.id,
          color: tinycolor(ta.color).setAlpha(0).toRgbString(),
          activeColor: ta.activeColor,
          textBlock: {
            ...ta.textBlock,
            color: 'transparent',
          },
        }),
      },
    },
  ],
};
