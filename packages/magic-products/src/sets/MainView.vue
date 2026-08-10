<script setup lang="ts">
  import { nullThrows } from '@core/utils/assert';
  import { Color } from '@core/utils/colors';
  import { MagicProduct } from '@magic/shared/product';

  import { computed } from 'vue';

  import { useCircleDrag } from './sets/composables/useCircleDrag.ts';
  import { useCircleResize } from './sets/composables/useCircleResize.ts';
  import { useCursorStyle } from './sets/composables/useCursorStyle.ts';
  import { useSetFocus } from './sets/composables/useSetFocus.ts';
  import { draw } from './sets/draw/index.ts';
  import { type SectionKey, getSectionKey } from './sets/other/sectionKey.ts';
  import { HighlightQueryId, Section } from './types.ts';
  import { useSetsProduct } from './useSetsProduct.ts';

  const {
    magic,
    setsProductState: { sets, queryAnalysis, theme, highlights },
  } = useSetsProduct();

  const { queryIdToSections } = queryAnalysis;

  const { definitions, sharedSections, addDefinition, removeDefinition } = sets;

  // the eye-toggle in HighlightRow hides a query's paint without touching whether it resolves
  const visibleQueryIdToSections = computed(() => {
    const sectionsByQueryId = new Map<HighlightQueryId, Section[]>();

    for (const [queryId, sections] of queryIdToSections.value) {
      if (highlights.getQuery(queryId).isHidden) continue;
      sectionsByQueryId.set(queryId, sections);
    }

    return sectionsByQueryId;
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

  const focus = useSetFocus({
    surface: magic.surface,
    definitions,
  });

  const sectionKeyToColors = computed(() => {
    const map = new Map<SectionKey, Color[]>();

    for (const [queryId, sections] of visibleQueryIdToSections.value) {
      const { color } = highlights.getQuery(queryId);
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
    focus.set(definition.id);
  };

  const deleteFocusedSets = () => {
    const focusedSetIds = sets.definitions.value
      .map((s) => s.id)
      .filter(focus.isFocused);
    for (const setId of focusedSetIds) removeDefinition(setId);
  };

  magic.surface.draw.content.value = (ctx) => {
    draw(
      ctx,
      {
        definitions: definitions.value,
        overlaps: sharedSections.value,
        sectionKeyToColors: sectionKeyToColors.value,
        isSetFocused: focus.isFocused,
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
