<script setup lang="ts">
  import { Color } from '@core/utils/colors';
  import Shell from '@magic/shared/Shell';

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
    shell,
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
    surface: shell.surface,
    definitions: sets.definitions,
  });

  useCircleDrag({
    surface: shell.surface,
    definitions: sets.definitions,
    isResizing,
  });

  const focus = useSetFocus({
    surface: shell.surface,
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
      shell.surface.cursorCoordinates.value,
    );
    focus.set(definition.id);
    // the prompt was to make one of these
    shell.onboarding?.close();
  };

  const deleteFocusedSetDefinitions = () => {
    const focusedSetIds = sets.definitions.value
      .map((s) => s.id)
      .filter(focus.isFocused);
    for (const setId of focusedSetIds) sets.removeDefinition(setId);
  };

  shell.surface.draw.content.value = (ctx) => {
    draw(
      ctx,
      {
        definitions: sets.definitions.value,
        sections: sections.value,
        sectionKeyToColors: sectionKeyToColors.value,
        isSetFocused: focus.isFocused,
        bounds: shell.surface.visibleWorldRect.value,
      },
      theme.value.set,
    );
  };

  shell.surface.events.canvas.subscribe('onDblClick', createSetDefinition);

  shell.shortcuts.add({
    id: 'delete-set',
    helpMenu: { category: 'Sets', name: 'Remove Set' },
    callback: deleteFocusedSetDefinitions,
    key: 'backspace',
  });

  useCursorStyle(sets.definitions, shell.surface);
</script>

<template>
  <Shell />
</template>
