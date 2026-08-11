import { circle } from '@canvas/primitives/shapes/circle/index';

import { SetDefinition } from '../../types.ts';
import { SetColors } from '../../useSetsTheme.ts';

export type DrawSetDefinitionCircleOptions = {
  ctx: CanvasRenderingContext2D;
  setDefinition: SetDefinition;
  isFocused: boolean;
  colors: SetColors;
};

const OUTLINE_WIDTH = 8;
const LABEL_FONT_SIZE = 24;

export const drawSetDefinitionCircle = (
  options: DrawSetDefinitionCircleOptions,
) => {
  const {
    colors: { outline, label },
    ctx,
    isFocused,
    setDefinition,
  } = options;

  circle({
    ...setDefinition.display,
    stroke: {
      color: isFocused ? outline.focused : outline.default,
      lineWidth: OUTLINE_WIDTH,
    },
    textArea: {
      // the sections painted underneath show through the label
      color: 'none',
      textBlock: {
        content: setDefinition.label,
        fontSize: LABEL_FONT_SIZE,
        fontWeight: 'bold',
        color: label,
      },
    },
  }).draw(ctx);
};
