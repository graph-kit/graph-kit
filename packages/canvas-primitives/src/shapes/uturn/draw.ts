import { rotatePoint } from '../../helpers.ts';
import { getColorAtPercentage } from '../../helpers.ts';
import type { GradientStop } from '../../types/utility.ts';
import { arrow } from '../arrow/index.ts';
import { line } from '../line/index.ts';
import type { UTurnSchemaWithDefaults } from './defaults.ts';

export const drawUTurnWithCtx = (schema: UTurnSchemaWithDefaults) => {
  const {
    spacing,
    at,
    upDistance,
    downDistance,
    rotation,
    lineWidth,
    fillColor: color,
    fillGradient,
  } = schema;

  const longLegFrom = rotatePoint(
    {
      x: at.x,
      y: at.y - spacing,
    },
    at,
    rotation,
  );

  const longLegTo = rotatePoint(
    {
      x: at.x + upDistance,
      y: at.y - spacing,
    },
    at,
    rotation,
  );

  const shortLegFrom = rotatePoint(
    {
      x: at.x + upDistance,
      y: at.y + spacing,
    },
    at,
    rotation,
  );

  const shortLegTo = rotatePoint(
    {
      x: at.x + upDistance - downDistance,
      y: at.y + spacing,
    },
    at,
    rotation,
  );

  const arcAt = rotatePoint(
    {
      x: at.x + upDistance,
      y: at.y,
    },
    at,
    rotation,
  );

  let lineGradient: GradientStop[] = [];
  let circleGradient: GradientStop[] = [];
  let arrowGradient: GradientStop[] = [];

  if (fillGradient && fillGradient.length >= 2) {
    const totalLength = upDistance + downDistance + Math.PI * spacing;

    const gradientColorAtCircleStart = getColorAtPercentage(
      fillGradient,
      upDistance / totalLength,
    );
    const gradientColorAtCircleEnd = getColorAtPercentage(
      fillGradient,
      (totalLength - downDistance) / totalLength,
    );

    lineGradient = [
      ...fillGradient.filter((stop) => stop.offset <= upDistance / totalLength),
      { offset: 1, color: gradientColorAtCircleStart },
    ];

    circleGradient = [
      { offset: 0, color: gradientColorAtCircleStart },
      ...fillGradient
        .filter(
          (stop) =>
            stop.offset >= upDistance / totalLength &&
            stop.offset <= (totalLength - downDistance) / totalLength,
        )
        .map((stop) => ({
          offset:
            (stop.offset - upDistance / totalLength) /
            ((Math.PI * spacing) / totalLength),
          color: stop.color,
        })),
      { offset: 1.0, color: gradientColorAtCircleEnd },
    ];

    arrowGradient = [
      { offset: 0, color: gradientColorAtCircleEnd },
      ...fillGradient
        .filter(
          (stop) => stop.offset >= (totalLength - downDistance) / totalLength,
        )
        .map((stop) => ({
          offset:
            (stop.offset - (totalLength - downDistance) / totalLength) /
            (downDistance / totalLength),
          color: stop.color,
        })),
    ];
  }

  const { drawShape: drawLongShaft } = line({
    start: longLegFrom,
    end: longLegTo,
    lineWidth: lineWidth,
    fillColor: color,
    fillGradient: lineGradient,
  });

  const { drawShape: drawShortShaft } = arrow({
    start: shortLegFrom,
    end: shortLegTo,
    lineWidth: lineWidth,
    fillColor: color,
    fillGradient: arrowGradient,
  });

  return (ctx: CanvasRenderingContext2D) => {
    drawLongShaft(ctx);
    drawShortShaft(ctx);

    // the arc is nothing but its stroke, so with no paint there is nothing to draw
    if (!color && circleGradient.length < 2) return;

    // draw the part that uturns
    ctx.beginPath();
    if (color) ctx.strokeStyle = color;

    if (circleGradient.length >= 2) {
      const startAngle = Math.PI / 2 + rotation + 0.01;
      const endAngle = -Math.PI / 2 + rotation - 0.01;

      const endX = arcAt.x + Math.cos(startAngle) * spacing;
      const endY = arcAt.y + Math.sin(startAngle) * spacing;
      const startX = arcAt.x + Math.cos(endAngle) * spacing;
      const startY = arcAt.y + Math.sin(endAngle) * spacing;
      const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
      for (const stop of circleGradient) {
        gradient.addColorStop(stop.offset, stop.color);
      }
      ctx.strokeStyle = gradient;
    }

    // +0.01, -0.01 to overlap
    ctx.arc(
      arcAt.x,
      arcAt.y,
      spacing,
      Math.PI / 2 + rotation + 0.01,
      -Math.PI / 2 + rotation - 0.01,
      true,
    );
    ctx.lineWidth = lineWidth;
    ctx.stroke();
    ctx.closePath();
  };
};
