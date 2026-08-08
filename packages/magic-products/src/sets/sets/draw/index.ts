import { getMagicCoordinates } from "@/canvas/coordinates"
import type { CircleFocusControls } from "../composables/useCircleFocus"
import type { Circle, Overlap } from "../types/types"
import { drawCircleBackground, drawCircleLabel, drawCircleOutline } from "./circles"
import { getHatchPattern } from "./hatchPattern"
import { colorOverlappingAreas } from "./overlaps"

type DrawProps = {
  circles: Circle[],
  overlaps: Overlap[],
  highlightedCircles: Map<Circle['label'], string[]>,
  highlightedOverlaps: Map<Overlap['id'], string[]>,
  isCircleFocused: CircleFocusControls['isCircleFocused'],
  backgroundColors: string[] | null,
}

export const draw = (ctx: CanvasRenderingContext2D, props: DrawProps) => {
  const { highlightedCircles, highlightedOverlaps } = props

  if (props.backgroundColors && props.backgroundColors.length > 1) {
    const start = getMagicCoordinates({ clientX: 0, clientY: 0 }, ctx)
    const end = getMagicCoordinates({ clientX: window.innerWidth, clientY: window.innerHeight }, ctx)
    ctx.save()
    ctx.imageSmoothingEnabled = false
    ctx.fillStyle = getHatchPattern(ctx, props.backgroundColors)
    ctx.fillRect(start.x, start.y, end.x - start.x, end.y - start.y)
    ctx.restore()
  }

  for (const circle of props.circles) {
    drawCircleBackground(ctx, {
      circle,
      highlightColors: highlightedCircles.get(circle.label) ?? null,
    })
  }

  colorOverlappingAreas(ctx, {
    circles: props.circles,
    overlaps: props.overlaps,
    highlightedCircles,
    highlightedOverlaps,
  })

  for (const circle of props.circles) {
    const options = {
      circle,
      isFocused: props.isCircleFocused(circle.label)
    }
    drawCircleOutline(ctx, options)
    drawCircleLabel(ctx, options)
  }
}
