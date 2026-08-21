import tinycolor from 'tinycolor2';

import { Timeline } from '../../timeline/define.ts';
import { AUTO_ANIMATE_DURATION_MS } from '../constants.ts';

export const arrowAdd: Timeline<'arrow'> = {
  forShapes: ['arrow'],
  durationMs: AUTO_ANIMATE_DURATION_MS,
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
