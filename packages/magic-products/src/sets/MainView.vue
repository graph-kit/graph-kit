<script setup lang="ts">
  import { nullThrows } from '@core/utils/assert';
  import { MagicProduct } from '@magic/shared/product';

  import { computed } from 'vue';

  import { useCircleDrag } from './sets/composables/useCircleDrag.ts';
  import { useCircleResize } from './sets/composables/useCircleResize.ts';
  import { useCursorStyle } from './sets/composables/useCursorStyle.ts';
  import { useSetFocus } from './sets/composables/useSetFocus.ts';
  import { draw } from './sets/draw/index.ts';
  import { isOutsideAllSetsSection } from './sets/other/constants.ts';
  import { type SectionKey, getSectionKey } from './sets/other/sectionKey.ts';
  import { HighlightGroup } from './types.ts';
  import { useSetsProduct } from './useSetsProduct.ts';

  const {
    magic,
    setsProductState: { sets, queryAnalysis, theme },
  } = useSetsProduct();

  const { activeHighlights } = queryAnalysis;

  const { definitions, sharedSections, addDefinition, removeDefinition } = sets;

  const sectionsToHighlight = computed<HighlightGroup[]>(() => {
    return activeHighlights.value
      .map((group) => ({
        ...group,
        sections: group.sections.filter(
          (section) => !isOutsideAllSetsSection(section),
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
      .filter((group) => group.sections.some(isOutsideAllSetsSection))
      .map((group) => group.color);
  });

  const highlightedSections = computed(() => {
    const map = new Map<SectionKey, string[]>();

    for (const { sections, color } of sectionsToHighlight.value) {
      for (const section of sections) {
        const key = getSectionKey(section);
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

  magic.surface.draw.content.value = (ctx) => {
    draw(
      ctx,
      {
        definitions: definitions.value,
        overlaps: sharedSections.value,
        highlightedSections: highlightedSections.value,
        isSetFocused: isFocused,
        highlightedOutside: highlightedOutside.value,
      },
      theme.value.set,
    );
  };

  magic.surface.domEvents.subscribe('onDblClick', createSet);

  magic.shortcuts.add({
    id: 'delete-set',
    callback: deleteFocusedSets,
    key: 'backspace',
  });

  const cursor = useCursorStyle(definitions, magic.surface);

  magic.surface.lifecycleEvents.subscribe('onAfterRepaint', () => {
    const canvas = nullThrows(magic.surface.canvas.value, 'canvas not defined');
    if (canvas.style.cursor === cursor.value) return;
    canvas.style.cursor = cursor.value;
  });
</script>

<template>
  <MagicProduct />
</template>
