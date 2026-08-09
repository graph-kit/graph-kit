<script setup lang="ts">
  import { MagicProduct } from '@magic/shared/product';

  import { computed } from 'vue';

  import { useCircleDrag } from './sets/composables/useCircleDrag.ts';
  import { useCircleFocus } from './sets/composables/useCircleFocus.ts';
  import { useCircleResize } from './sets/composables/useCircleResize.ts';
  import { useCursorStyle } from './sets/composables/useCursorStyle.ts';
  import { draw } from './sets/draw/index.ts';
  import { OUTSIDE_ALL_SETS } from './sets/other/constants.ts';
  import { HighlightGroup, Overlap, SetDefinitionId } from './types.ts';
  import { useCanvasTheme } from './useCanvasTheme.ts';
  import { useSetsProduct } from './useSetsProduct.ts';

  const {
    magic,
    setsProductState: { activeSubsets, sets },
  } = useSetsProduct();

  const { definitions, overlaps, addDefinition, removeDefinition } = sets;

  useCanvasTheme(magic);

  const isOutsideAllSets = (section: SetDefinitionId[]) =>
    section.length === 1 && section[0] === OUTSIDE_ALL_SETS.identity;

  const setSectionsToHighlight = computed<HighlightGroup[]>(() => {
    return activeSubsets.value
      .map((group) => ({
        ...group,
        sections: group.sections.filter(
          (section) => !isOutsideAllSets(section),
        ),
      }))
      .filter((group) => group.sections.length > 0);
  });

  const { isResizing } = useCircleResize({
    surface: magic.surface,
    definitions,
  });

  useCircleDrag({
    surface: magic.surface,
    definitions,
    isResizing,
  });

  const { focusedSetIds, isSetFocused, setFocus } = useCircleFocus({
    surface: magic.surface,
    definitions,
  });

  const backgroundColors = computed(() => {
    return activeSubsets.value
      .filter((group) => group.sections.some(isOutsideAllSets))
      .map((group) => group.color);
  });

  const highlightedSets = computed(() => {
    const map = new Map<SetDefinitionId, string[]>();
    for (const { sections, color } of setSectionsToHighlight.value) {
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
      const key = overlap.sets.toSorted((a, b) => a.localeCompare(b)).join('.');
      overlapByKey.set(key, overlap);
    }
    const map = new Map<Overlap['id'], string[]>();
    for (const { sections, color } of setSectionsToHighlight.value) {
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

  const createSet = () => {
    const definition = addDefinition(magic.surface.cursorCoordinates.value);
    setFocus(definition.id);
  };

  const deleteFocusedSets = () => {
    for (const setId of [...focusedSetIds.value]) removeDefinition(setId);
  };

  magic.shortcuts.add({
    id: 'delete-set',
    callback: () => deleteFocusedSets(),
    key: 'backspace',
  });

  magic.surface.draw.content.value = (ctx) => {
    draw(ctx, {
      definitions: definitions.value,
      overlaps: overlaps.value,
      highlightedSets: highlightedSets.value,
      highlightedOverlaps: highlightedOverlaps.value,
      isSetFocused,
      backgroundColors:
        backgroundColors.value.length > 1 ? backgroundColors.value : null,
    });
  };

  magic.surface.domEvents.subscribe('onDblClick', createSet);

  const cursor = useCursorStyle(definitions, magic.surface.cursorCoordinates);
</script>

<template>
  <MagicProduct />
</template>
