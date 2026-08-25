import tinycolor from 'tinycolor2';

import { AutoAnimateTimeline } from '../types.ts';

export const arrowRemove: AutoAnimateTimeline<'arrow'> = {
  forShapes: ['arrow'],
  easing: {
    lineWidth: 'in-out',
    textArea: 'in-out',
  },
  keyframes: [
    {
      progress: 0,
      properties: {
        lineWidth: (lw) => lw,
        fillColor: (c) => c,
      },
    },
    {
      progress: 1,
      properties: {
        lineWidth: 0,
        fillColor: (c) => tinycolor(c).setAlpha(0).toRgbString(),
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
