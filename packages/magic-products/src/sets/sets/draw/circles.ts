import { FontWeight } from '@canvas/primitives/text/types';

import { SetDefinition } from '../../types.ts';
import { SetColors } from '../../useSetsTheme.ts';

export type DrawSetDefinitionCircleOptions = {
  ctx: CanvasRenderingContext2D;
  setDefinition: SetDefinition;
  isFocused: boolean;
  colors: SetColors;
};

export const drawCircleStroke = (options: DrawSetDefinitionCircleOptions) => {
  const {
    colors: { outline },
    ctx,
    isFocused,
    setDefinition,
  } = options;

  const { at, radius } = setDefinition.display;

  ctx.beginPath();
  ctx.arc(at.x, at.y, radius, 0, 2 * Math.PI);
  ctx.lineWidth = 8;
  ctx.strokeStyle = isFocused ? outline.focused : outline.default;
  ctx.stroke();
};

export const drawCircleTextLabel = (
  options: DrawSetDefinitionCircleOptions,
) => {
  const { setDefinition, ctx, colors } = options;
  const {
    label,
    display: { at },
  } = setDefinition;

  const fontWeight: FontWeight = 'bold';
  const fontSize = 24;
  const fontFamily = 'Arial';
  const color = colors.label;
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, at.x, at.y);
  ctx.stroke();
};
