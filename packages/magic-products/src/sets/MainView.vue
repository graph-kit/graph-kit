<script setup lang="ts">
  import { useCanvas } from '@canvas/surface/index';
  import { MagicProduct, useMagicProduct } from '@magic/shared/product';

  import { computed, ref } from 'vue';

  import { initHost } from './host.ts';
  import { useAllSections } from './sets/composables/useAllSections.ts';
  import { useCircleDrag } from './sets/composables/useCircleDrag.ts';
  import { useCircleFocus } from './sets/composables/useCircleFocus.ts';
  import { useCircleResize } from './sets/composables/useCircleResize.ts';
  import { useCursorStyle } from './sets/composables/useCursorStyle.ts';
  import { useLabelGetter } from './sets/composables/useLabel.ts';
  import { useOverlaps } from './sets/composables/useOverlaps.ts';
  import { draw } from './sets/draw/index.ts';
  import { COLORS } from './sets/other/constants.ts';
  import {
    Circle,
    CircleLabel,
    HighlightGroup,
    Overlap,
  } from './sets/types/types.ts';
  import { useCanvasTheme } from './useCanvasTheme.ts';

  const surface = useCanvas();

  const magic = useMagicProduct(initHost(surface), {
    productId: 'sets',
    ui: { linkSharing: false },
  });

  useCanvasTheme(magic);

  const activeSubsets = ref<HighlightGroup[]>([]);

  const circleSectionsToHighlight = computed<HighlightGroup[]>(() => {
    return activeSubsets.value
      .map((group) => ({
        ...group,
        sections: group.sections.filter(
          (s) => !(s.length === 1 && s[0] === 'S'),
        ),
      }))
      .filter((group) => group.sections.length > 0);
  });

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

  const { isCircleFocused, setFocus } = useCircleFocus({
    surface: surface,
    circles,
  });

  const backgroundColors = computed(() => {
    return activeSubsets.value
      .filter((group) =>
        group.sections.some((s) => s.length === 1 && s[0] === 'S'),
      )
      .map((group) => group.color);
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

  const createCircle = () => {
    const newCircle: Circle = {
      label: getCircleLabel(),
      at: surface.cursorCoordinates.value,
      radius: 70,
    };
    circles.value.push(newCircle);
    setFocus(newCircle.label);
  };

  const deleteCircle = () => {
    circles.value = circles.value.filter((c) => !isCircleFocused(c.label));
  };

  magic.shortcuts.add({
    id: 'delete-set',
    callback: () => deleteCircle(),
    key: 'backspace',
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

  surface.domEvents.subscribe('onDblClick', createCircle);

  const cursor = useCursorStyle(circles, surface.cursorCoordinates);
</script>

<template>
  <MagicProduct />
</template>
