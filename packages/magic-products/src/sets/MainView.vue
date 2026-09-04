<script setup lang="ts">
  import Shell from '@magic/shared/Shell';
  import { toast } from '@magic/shared/toast';

  import { useCircleDrag } from './composables/useCircleDrag.ts';
  import { useCircleResize } from './composables/useCircleResize.ts';
  import { useSetsRendering } from './composables/useSetsRendering.ts';
  import { MAX_SETS } from './constants.ts';
  import { useSetsProduct } from './useSetsProduct.ts';

  const {
    shell,
    setsProductState: { sets, sections, queryAnalysis, theme, queries, focus },
  } = useSetsProduct();

  useCircleResize({ surface: shell.surface, definitions: sets.definitions });

  useCircleDrag({
    surface: shell.surface,
    definitions: sets.definitions,
    theme,
  });

  useSetsRendering({
    surface: shell.surface,
    sets,
    queries,
    sections,
    queryIdToSections: queryAnalysis.queryIdToSections,
    focus,
    theme,
  });

  const CAPACITY_TOAST_MS = 5_000;

  /* prevent a few angry clicks from popping 4 separate toasts */
  let capacityToastId: string | undefined;

  const sayCanvasIsFull = () => {
    const stillUp = toast.entries.value.some(
      (entry) => entry.id === capacityToastId && entry.open,
    );
    if (stillUp) return;

    capacityToastId = toast.show({
      title: 'Set Limit Reached',
      description: `A canvas holds up to ${MAX_SETS} sets.`,
      severity: 'info',
      duration: CAPACITY_TOAST_MS,
    });
  };

  const createSetDefinition = () => {
    const definition = sets.addDefinition(
      shell.surface.cursorCoordinates.value,
    );

    if (!definition) {
      sayCanvasIsFull();
      return;
    }

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

  shell.surface.events.canvas.subscribe('onDblClick', createSetDefinition);

  shell.shortcuts.add({
    id: 'delete-set',
    helpMenu: { category: 'Sets', name: 'Remove Set' },
    callback: deleteFocusedSetDefinitions,
    key: 'backspace',
  });
</script>

<template>
  <Shell />
</template>
