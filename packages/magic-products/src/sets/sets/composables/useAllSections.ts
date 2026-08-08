import type { Circle, Overlap } from "@/sets/types/types"
import { computed, type Ref } from "vue"
import { RESERVED_LABELS } from "../other/constants"

/**
 * all individual sections of the set space
 */
export const useAllSections = (circles: Ref<Circle[]>, overlaps: Ref<Overlap[]>) => {
  return computed(() => {
    const overlapsWithNames = overlaps.value.map(o => o.circles)
    const circlesByThemselves = circles.value.map(c => c.label).map(id => [id])

    return [
      ...overlapsWithNames,
      ...circlesByThemselves,
      ...RESERVED_LABELS.map(l => [l]),
    ]
  })
}