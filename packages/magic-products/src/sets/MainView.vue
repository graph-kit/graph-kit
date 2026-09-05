<script setup lang="ts">
  import type { ElementMouseEvent } from '@canvas/surface/events/index';
  import Shell from '@magic/shared/Shell';
  import { toast } from '@magic/shared/toast';

  import { useSetsRendering } from './composables/useSetsRendering.ts';
  import { INPUT_HANDLER_ID, MAX_SETS } from './constants.ts';
  import { useSetsShell } from './sets-shell/useSetsShell.ts';

  const {
    shell,
    setsState: { sets, sections, queryAnalysis, theme, queries, focus },
  } = useSetsShell();

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

  const createSetDefinition = ({ coords }: ElementMouseEvent) => {
    const definition = sets.addDefinition(coords);

    if (!definition) {
      sayCanvasIsFull();
      return;
    }

    focus.set(definition.id);
  };

  const deleteFocusedSetDefinitions = () => {
    const focusedSetIds = sets.definitions.value
      .map((definition) => definition.id)
      .filter(focus.isFocused);
    sets.remove(focusedSetIds);
  };

  shell.surface.events.elements.handle(
    'onDblClick',
    createSetDefinition,
    INPUT_HANDLER_ID.createSet,
  );

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
