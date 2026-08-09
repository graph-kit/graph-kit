import { circle } from '@canvas/primitives/shapes/circle/index';
import { FontWeight } from '@canvas/primitives/text/types';

import { Circle } from '../../types.ts';
import { COLORS } from '../other/constants.ts';

type DrawCircleBackgroundProps = {
  circle: Circle;
  highlightColors: string[] | null;
};

export const drawCircleBackground = (
  ctx: CanvasRenderingContext2D,
  props: DrawCircleBackgroundProps,
) => {
  const { circle: c, highlightColors } = props;
  if (highlightColors && highlightColors.length !== 1) return;
  circle({
    ...c,
    fillColor: highlightColors?.[0] ?? COLORS.BACKGROUND,
  }).draw(ctx);
};

type DrawCircleOutlineProps = {
  circle: Circle;
  isFocused: boolean;
};

export const drawCircleOutline = (
  ctx: CanvasRenderingContext2D,
  props: DrawCircleOutlineProps,
) => {
  const {
    at: { x, y },
    radius,
  } = props.circle;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  ctx.lineWidth = 6;
  ctx.strokeStyle = props.isFocused
    ? COLORS.CIRCLE_FOCUSED
    : COLORS.CIRCLE_OUTLINE;
  ctx.stroke();
};

type DrawCircleLabelProps = {
  circle: Circle;
  isFocused: boolean;
};

export const drawCircleLabel = (
  ctx: CanvasRenderingContext2D,
  props: DrawCircleLabelProps,
) => {
  const {
    at: { x, y },
    label,
  } = props.circle;
  const fontWeight: FontWeight = 'bold';
  const fontSize = 24;
  const fontFamily = 'Arial';
  const color = COLORS.CIRCLE_OUTLINE;
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x, y);
  ctx.stroke();
};
