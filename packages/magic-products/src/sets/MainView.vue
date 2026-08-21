<script setup lang="ts">
  import { Color } from '@core/utils/colors';
  import { MagicProduct } from '@magic/shared/product';

  import { computed } from 'vue';

  import { useCircleDrag } from './sets/composables/useCircleDrag.ts';
  import { useCircleResize } from './sets/composables/useCircleResize.ts';
  import { useCursorStyle } from './sets/composables/useCursorStyle.ts';
  import { useSetFocus } from './sets/composables/useSetFocus.ts';
  import { draw } from './sets/draw/index.ts';
  import { type SectionKey, getSectionKey } from './sets/other/sectionKey.ts';
  import { QueryId, Section } from './types.ts';
  import { useSetsProduct } from './useSetsProduct.ts';

  const {
    magic,
    setsProductState: { sets, sections, queryAnalysis, theme, queries },
  } = useSetsProduct();

  const { queryIdToSections } = queryAnalysis;

  // the eye-toggle in Query hides a query's paint without touching whether it resolves
  const visibleQueryIdToSections = computed(() => {
    const sectionsByQueryId = new Map<QueryId, Section[]>();

    for (const [queryId, sections] of queryIdToSections.value) {
      if (queries.getQuery(queryId).hidden) continue;
      sectionsByQueryId.set(queryId, sections);
    }

    return sectionsByQueryId;
  });

  const { isResizing } = useCircleResize({
    surface: magic.surface,
    definitions: sets.definitions,
  });

  useCircleDrag({
    surface: magic.surface,
    definitions: sets.definitions,
    isResizing,
  });

  const focus = useSetFocus({
    surface: magic.surface,
    definitions: sets.definitions,
  });

  const sectionKeyToColors = computed(() => {
    const map = new Map<SectionKey, Color[]>();

    for (const [queryId, sections] of visibleQueryIdToSections.value) {
      const { color } = queries.getQuery(queryId);
      for (const section of sections) {
        const key = getSectionKey(section);
        const existing = map.get(key) ?? [];
        existing.push(color);
        map.set(key, existing);
      }
    }

    return map;
  });

  const createSetDefinition = () => {
    const definition = sets.addDefinition(
      magic.surface.cursorCoordinates.value,
    );
    focus.set(definition.id);
  };

  const deleteFocusedSetDefinitions = () => {
    const focusedSetIds = sets.definitions.value
      .map((s) => s.id)
      .filter(focus.isFocused);
    for (const setId of focusedSetIds) sets.removeDefinition(setId);
  };

  magic.surface.draw.content.value = (ctx) => {
    draw(
      ctx,
      {
        definitions: sets.definitions.value,
        sections: sections.value,
        sectionKeyToColors: sectionKeyToColors.value,
        isSetFocused: focus.isFocused,
        bounds: magic.surface.visibleWorldRect.value,
      },
      theme.value.set,
    );
  };

  magic.surface.events.canvas.subscribe('onDblClick', createSetDefinition);

  magic.shortcuts.add({
    id: 'delete-set',
    callback: deleteFocusedSetDefinitions,
    key: 'backspace',
  });

  useCursorStyle(sets.definitions, magic.surface);
</script>

<template>
  <MagicProduct />
</template>
