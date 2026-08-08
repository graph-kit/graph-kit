import type { Circle } from '@/sets/types/types'
import { COLORS } from '@/sets/other/constants'
import { circle } from '@/shapes/shapes/circle'
import { getHatchPattern } from './hatchPattern'

type DrawCircleBackgroundProps = {
  circle: Circle,
  highlightColors: string[] | null,
}

export const drawCircleBackground = (ctx: CanvasRenderingContext2D, props: DrawCircleBackgroundProps) => {
  const { circle: c, highlightColors } = props

  if (!highlightColors || highlightColors.length === 1) {
    circle({
      ...c,
      fillColor: highlightColors?.[0] ?? COLORS.BACKGROUND,
    }).draw(ctx)
    return
  }

  ctx.save()
  ctx.beginPath()
  ctx.arc(c.at.x, c.at.y, c.radius, 0, 2 * Math.PI)
  ctx.imageSmoothingEnabled = false
  ctx.fillStyle = getHatchPattern(ctx, highlightColors)
  ctx.fill()
  ctx.restore()
}

type DrawCircleOutlineProps = {
  circle: Circle,
  isFocused: boolean,
}

export const drawCircleOutline = (ctx: CanvasRenderingContext2D, props: DrawCircleOutlineProps) => {
  const { at: { x, y }, radius } = props.circle;
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, 2 * Math.PI)
  ctx.lineWidth = 3
  ctx.strokeStyle = props.isFocused ? COLORS.CIRCLE_FOCUSED : COLORS.CIRCLE_OUTLINE
  ctx.stroke()
}

type DrawCircleLabelProps = {
  circle: Circle,
  isFocused: boolean,
}

export const drawCircleLabel = (ctx: CanvasRenderingContext2D, props: DrawCircleLabelProps) => {
  const { at: { x, y }, label } = props.circle;
  ctx.font = '15px Arial';
  ctx.fillStyle = props.isFocused ? COLORS.CIRCLE_FOCUSED : COLORS.CIRCLE_OUTLINE;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x, y);
  ctx.stroke();
}