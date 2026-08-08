<template>
  <MagicCanvas
    v-bind="magicCanvas.ref"
    @dblclick="createCircle"
    :style="{ cursor: cursorStyle }"
  />
</template>

<script setup lang="ts">
  import { computed, onBeforeUnmount, ref, watch } from "vue";
  import type { Circle, Overlap, HighlightGroup } from "../types/types";
  import { COLORS } from "@/sets/other/constants";
  import MagicCanvas from "@canvas/MagicCanvas.vue";
  import { useMagicCanvas } from "@canvas/index";
  import { useLabelGetter } from "../composables/useLabel";
  import { useOverlaps } from "@/sets/composables/useOverlaps.js";
  import { useCanvasFocus } from "@/sets/composables/useCanvasFocus";
  import { useAllSections } from "@/sets/composables/useAllSections";
  import { cross } from "@/shapes/shapes/cross";
  import { useCircleDrag } from "../composables/useCircleDrag";
  import { useCircleResize } from "../composables/useCircleResize";
  import { useCircleFocus } from "../composables/useCircleFocus";
  import { draw } from "../draw";
  import keys from "ctrl-keys";
  import { useCursorStyle } from "../composables/useCursorStyle.js";

  const magicCanvas = useMagicCanvas();

  const props = defineProps<{
    sectionsToHighlight: HighlightGroup[];
  }>();

  const emits = defineEmits<{
    (e: "sections-updated", value: Circle["label"][][]): void;
  }>();

  const circleSectionsToHighlight = computed<HighlightGroup[]>(() => {
    return props.sectionsToHighlight
      .map(group => ({
        ...group,
        sections: group.sections.filter(s => !(s.length === 1 && s[0] === 'S')),
      }))
      .filter(group => group.sections.length > 0);
  });

  const { canvasFocused } = useCanvasFocus(magicCanvas.canvas);

  const circles = ref<Circle[]>([]);
  const getCircleLabel = useLabelGetter(circles);

  const { isResizing } = useCircleResize({
    magicCanvas,
    circles,
  });

  useCircleDrag({
    magicCanvas,
    circles,
    isResizing,
  });

  const cursorStyle = useCursorStyle(circles, magicCanvas.cursorCoordinates)

  const { isCircleFocused, setFocus } = useCircleFocus({
    magicCanvas,
    circles,
  });

  const backgroundColors = computed(() => {
    return props.sectionsToHighlight
      .filter(group => group.sections.some(s => s.length === 1 && s[0] === 'S'))
      .map(group => group.color);
  });

  const canvasColor = computed(() => {
    if (backgroundColors.value.length === 1) return backgroundColors.value[0];
    return COLORS.BACKGROUND;
  });

  const overlaps = useOverlaps(circles);
  const allSections = useAllSections(circles, overlaps);

  const highlightedCircles = computed(() => {
    const map = new Map<Circle['label'], string[]>()
    for (const { sections, color } of circleSectionsToHighlight.value) {
      for (const section of sections) {
        if (section.length === 1) {
          const existing = map.get(section[0]) ?? []
          existing.push(color)
          map.set(section[0], existing)
        }
      }
    }
    return map
  })

  const highlightedOverlaps = computed(() => {
    const overlapByKey = new Map<string, Overlap>()
    for (const overlap of overlaps.value) {
      const key = overlap.circles.toSorted((a, b) => a.localeCompare(b)).join('.')
      overlapByKey.set(key, overlap)
    }
    const map = new Map<Overlap['id'], string[]>()
    for (const { sections, color } of circleSectionsToHighlight.value) {
      for (const section of sections) {
        if (section.length > 1) {
          const key = section.toSorted((a, b) => a.localeCompare(b)).join('.')
          const overlap = overlapByKey.get(key)
          if (overlap) {
            const existing = map.get(overlap.id) ?? []
            existing.push(color)
            map.set(overlap.id, existing)
          }
        }
      }
    }
    return map
  })

  magicCanvas.draw.content.value = (ctx) => {
    draw(ctx, {
      circles: circles.value,
      overlaps: overlaps.value,
      highlightedCircles: highlightedCircles.value,
      highlightedOverlaps: highlightedOverlaps.value,
      isCircleFocused,
      backgroundColors: backgroundColors.value.length > 1 ? backgroundColors.value : null,
    });
  };

  magicCanvas.draw.backgroundPattern.value = (ctx, at, alpha) => {
    cross({
      at,
      size: 14,
      lineWidth: 1,
      fillColor: "#6b7280" + alpha,
    }).draw(ctx);
  };

  watch(allSections, () => {
    emits("sections-updated", allSections.value);
  }, { immediate: true });

  const createCircle = () => {
    const newCircle: Circle = {
      label: getCircleLabel(),
      at: magicCanvas.cursorCoordinates.value,
      radius: 70,
    };
    circles.value.push(newCircle);
    setFocus(newCircle.label);
  };

  const ctrlKeysHandler = keys();

  ctrlKeysHandler.add("backspace", () => {
    if (!canvasFocused.value) return;
    deleteCircle();
  });

  const deleteCircle = () => {
    circles.value = circles.value.filter((c) => !isCircleFocused(c.label));
  };

  document.addEventListener("keydown", ctrlKeysHandler.handle);
  onBeforeUnmount(() => {
    document.removeEventListener("keydown", ctrlKeysHandler.handle);
  });
</script>

<style scoped>
  canvas {
    background: v-bind(canvasColor);
  }
</style>
