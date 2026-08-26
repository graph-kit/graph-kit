import tinycolor from 'tinycolor2';

import { AutoAnimateTimeline } from '../types.ts';

export const arrowAdd: AutoAnimateTimeline<'arrow'> = {
  forShapes: ['arrow'],
  easing: {
    lineWidth: 'in-out',
    textArea: 'in-out',
  },
  keyframes: [
    {
      progress: 0,
      properties: {
        lineWidth: 0,
        end: (_, { start }) => start,
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
