import type { StarSchemaWithDefaults } from './defaults.ts';

export const drawStarWithCtx = (schema: StarSchemaWithDefaults) => {
  const {
    at,
    fillColor: color,
    innerRadius,
    outerRadius,
    rotation,
    points,
  } = schema;

  return (ctx: CanvasRenderingContext2D) => {
    if (!color) return;

    ctx.save();
    ctx.beginPath();
    ctx.translate(at.x, at.y);
    ctx.rotate(rotation);

    // Draw the star shape
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / points;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  };
};
