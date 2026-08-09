<script setup lang="ts">
  import CanvasSurface from '@canvas/surface/CanvasSurface.vue';
  import { useCanvas } from '@canvas/surface/index';
  import keys from 'ctrl-keys';

  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

  import type { Circle, HighlightGroup, Overlap } from '../../types.ts';
  import { useAllSections } from '../composables/useAllSections.ts';
  import { useCanvasFocus } from '../composables/useCanvasFocus.ts';
  import { useCircleDrag } from '../composables/useCircleDrag.ts';
  import { useCircleFocus } from '../composables/useCircleFocus.ts';
  import { useCircleResize } from '../composables/useCircleResize.ts';
  import { useCursorStyle } from '../composables/useCursorStyle.ts';
  import { useLabelGetter } from '../composables/useLabel.ts';
  import { useOverlaps } from '../composables/useOverlaps.ts';
  import { draw } from '../draw/index.ts';
  import { COLORS } from '../other/constants.ts';

  const surface = useCanvas();

  const props = defineProps<{
    sectionsToHighlight: HighlightGroup[];
  }>();

  const emits = defineEmits<{
    (e: 'sections-updated', value: Circle['label'][][]): void;
  }>();

  const circleSectionsToHighlight = computed<HighlightGroup[]>(() => {
    return props.sectionsToHighlight
      .map((group) => ({
        ...group,
        sections: group.sections.filter(
          (s) => !(s.length === 1 && s[0] === 'S'),
        ),
      }))
      .filter((group) => group.sections.length > 0);
  });

  const { canvasFocused } = useCanvasFocus(surface.canvas);

  const circles = ref<Circle[]>([]);
  const getCircleLabel = useLabelGetter(circles);

  const { isResizing } = useCircleResize({
    surface: surface,
    circles,
  });

  useCircleDrag({
    surface: surface,
    circles,
    isResizing,
  });

  const cursorStyle = useCursorStyle(circles, surface.cursorCoordinates);

  const { isCircleFocused, setFocus } = useCircleFocus({
    surface: surface,
    circles,
  });

  const backgroundColors = computed(() => {
    return props.sectionsToHighlight
      .filter((group) =>
        group.sections.some((s) => s.length === 1 && s[0] === 'S'),
      )
      .map((group) => group.color);
  });

  const canvasColor = computed(() => {
    if (backgroundColors.value.length === 1) return backgroundColors.value[0];
    return COLORS.BACKGROUND;
  });

  const overlaps = useOverlaps(circles);
  const allSections = useAllSections(circles, overlaps);

  const highlightedCircles = computed(() => {
    const map = new Map<Circle['label'], string[]>();
    for (const { sections, color } of circleSectionsToHighlight.value) {
      for (const section of sections) {
        if (section.length === 1) {
          const existing = map.get(section[0]) ?? [];
          existing.push(color);
          map.set(section[0], existing);
        }
      }
    }
    return map;
  });

  const highlightedOverlaps = computed(() => {
    const overlapByKey = new Map<string, Overlap>();
    for (const overlap of overlaps.value) {
      const key = overlap.circles
        .toSorted((a, b) => a.localeCompare(b))
        .join('.');
      overlapByKey.set(key, overlap);
    }
    const map = new Map<Overlap['id'], string[]>();
    for (const { sections, color } of circleSectionsToHighlight.value) {
      for (const section of sections) {
        if (section.length > 1) {
          const key = section.toSorted((a, b) => a.localeCompare(b)).join('.');
          const overlap = overlapByKey.get(key);
          if (overlap) {
            const existing = map.get(overlap.id) ?? [];
            existing.push(color);
            map.set(overlap.id, existing);
          }
        }
      }
    }
    return map;
  });

  surface.draw.content.value = (ctx) => {
    draw(ctx, {
      circles: circles.value,
      overlaps: overlaps.value,
      highlightedCircles: highlightedCircles.value,
      highlightedOverlaps: highlightedOverlaps.value,
      isCircleFocused,
      backgroundColors:
        backgroundColors.value.length > 1 ? backgroundColors.value : null,
    });
  };

  watch(
    allSections,
    () => {
      emits('sections-updated', allSections.value);
    },
    { immediate: true },
  );

  const createCircle = () => {
    const newCircle: Circle = {
      label: getCircleLabel(),
      at: surface.cursorCoordinates.value,
      radius: 70,
    };
    circles.value.push(newCircle);
    setFocus(newCircle.label);
  };

  const ctrlKeysHandler = keys();

  ctrlKeysHandler.add('backspace', () => {
    if (!canvasFocused.value) return;
    deleteCircle();
  });

  const deleteCircle = () => {
    circles.value = circles.value.filter((c) => !isCircleFocused(c.label));
  };

  onMounted(() => {
    document.addEventListener('keydown', ctrlKeysHandler.handle);
  });

  onBeforeUnmount(() => {
    document.removeEventListener('keydown', ctrlKeysHandler.handle);
  });
</script>

<template>
  <CanvasSurface
    v-bind="surface.ref"
    @dblclick="createCircle"
    :style="{ cursor: cursorStyle }"
  />
</template>

<style scoped>
  canvas {
    background: v-bind(canvasColor);
  }
</style>
