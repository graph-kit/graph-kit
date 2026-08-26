import tinycolor from 'tinycolor2';

import { AutoAnimateTimeline } from '../types.ts';

export const lineRemove: AutoAnimateTimeline<'line'> = {
  forShapes: ['line'],
  easing: {
    lineWidth: 'in-out',
    textArea: 'in-out',
  },
  keyframes: [
    {
      progress: 0,
      properties: {
        lineWidth: (lineWidth) => lineWidth,
        fillColor: (fillColor) => fillColor,
      },
    },
    {
      progress: 1,
      properties: {
        lineWidth: 0,
        fillColor: (fillColor) =>
          tinycolor(fillColor).setAlpha(0).toRgbString(),
        textArea: (textArea) => ({
          id: textArea.id,
          color: tinycolor(textArea.color).setAlpha(0).toRgbString(),
          activeColor: textArea.activeColor,
          textBlock: {
            ...textArea.textBlock,
            color: 'transparent',
          },
        }),
      },
    },
  ],
};
