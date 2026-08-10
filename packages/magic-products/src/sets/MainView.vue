<script setup lang="ts">
  import { nullThrows } from '@core/utils/assert';
  import { MagicProduct } from '@magic/shared/product';

  import { computed } from 'vue';

  import { useCircleDrag } from './sets/composables/useCircleDrag.ts';
  import { useCircleResize } from './sets/composables/useCircleResize.ts';
  import { useCursorStyle } from './sets/composables/useCursorStyle.ts';
  import { useSetFocus } from './sets/composables/useSetFocus.ts';
  import { draw } from './sets/draw/index.ts';
  import {
    OUTSIDE_ALL_SETS,
    useSetColorTheme,
  } from './sets/other/constants.ts';
  import { type SectionKey, getSectionKey } from './sets/other/sectionKey.ts';
  import { HighlightGroup, SetDefinitionId } from './types.ts';
  import { useCanvasTheme } from './useCanvasTheme.ts';
  import { useSetsProduct } from './useSetsProduct.ts';

  const {
    magic,
    setsProductState: { sets, queryAnalysis },
  } = useSetsProduct();

  const { activeHighlights } = queryAnalysis;

  const { definitions, sharedSections, addDefinition, removeDefinition } = sets;

  useCanvasTheme(magic);

  const isOutsideAllSets = (section: SetDefinitionId[]) =>
    section.length === 1 && section[0] === OUTSIDE_ALL_SETS.identity;

  const setSectionsToHighlight = computed<HighlightGroup[]>(() => {
    return activeHighlights.value
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

  const { focusedSetIds, isFocused, setFocus } = useSetFocus({
    surface: magic.surface,
    definitions,
  });

  const highlightedOutside = computed(() => {
    return activeHighlights.value
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
    const existingKeys = new Set(sharedSections.value.map(getSectionKey));
    const map = new Map<SectionKey, string[]>();

    for (const { sections, color } of setSectionsToHighlight.value) {
      for (const section of sections) {
        if (section.length === 1) continue;

        const key = getSectionKey(section);
        // a section only paints if the circles actually overlap there
        if (!existingKeys.has(key)) continue;

        const existing = map.get(key) ?? [];
        existing.push(color);
        map.set(key, existing);
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

  const colors = useSetColorTheme(magic);

  magic.surface.draw.content.value = (ctx) => {
    draw(
      ctx,
      {
        definitions: definitions.value,
        overlaps: sharedSections.value,
        highlightedSets: highlightedSets.value,
        highlightedOverlaps: highlightedOverlaps.value,
        isSetFocused: isFocused,
        highlightedOutside: highlightedOutside.value,
      },
      colors.value,
    );
  };

  magic.surface.domEvents.subscribe('onDblClick', createSet);

  magic.shortcuts.add({
    id: 'delete-set',
    callback: deleteFocusedSets,
    key: 'backspace',
  });

  const cursor = useCursorStyle(definitions, magic.surface.cursorCoordinates);

  magic.surface.lifecycleEvents.subscribe('onAfterRepaint', () => {
    const canvas = nullThrows(magic.surface.canvas.value, 'canvas not defined');
    if (canvas.style.cursor === cursor.value) return;
    canvas.style.cursor = cursor.value;
  });
</script>

<template>
  <MagicProduct />
</template>
