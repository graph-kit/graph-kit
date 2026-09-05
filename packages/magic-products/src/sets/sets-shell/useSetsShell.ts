import { useCanvasSurface } from '@canvas/surface/index';
import { canvasCursorOverride } from '@core/themes/index';
import { ProductControls, Shell, useShell } from '@magic/shared/product';

import { computed, ref } from 'vue';

import QueryPanel from '../components/QueryPanel.vue';
import { useCircleDrag } from '../composables/useCircleDrag.ts';
import { useCircleResize } from '../composables/useCircleResize.ts';
import { useSections } from '../composables/useSections.ts';
import { useSetFocus } from '../composables/useSetFocus.ts';
import { useSetsAnnotations } from '../composables/useSetsAnnotations.ts';
import { createQueries } from '../queries.ts';
import { useQueryAnalysis } from '../queryAnalysis.ts';
import { createSetDefinitions } from '../setDefinitions.ts';
import { createSetGestures } from '../setGestures.ts';
import { useCanvasAppearance } from '../theme/useCanvasAppearance.ts';
import { useSetsTheme } from '../theme/useSetsTheme.ts';
import { provideSetsState } from './context.ts';
import { createSetsHistory } from './history.ts';
import { bindSetsToDoc } from './multiplayer/bindSetsToDoc.ts';
import { trackDraggedSets } from './multiplayer/trackDraggedSets.ts';
import { SETS_ONBOARDING } from './onboarding.ts';
import { setsTransitCompression } from './transit-compression.ts';
import { createSetsTransit } from './transit.ts';
import { SetsState } from './types.ts';

/** adapts sets to the shell's controls interface, see {@link useShell} */
export const useSetsShell = (): {
  shell: Shell;
  setsState: SetsState;
} => {
  const theme = useSetsTheme();

  const surface = useCanvasSurface({
    canvasCursor: () =>
      canvasCursorOverride(theme._resolveToken('canvas.cursor')),
  });

  const annotations = useSetsAnnotations({ surface, theme });

  const sets = createSetDefinitions();
  const queries = createQueries();
  const sections = useSections(sets.definitions);
  const focus = useSetFocus({ surface });

  const gestures = createSetGestures();

  /*
    the room's read tier. without it a viewer goes on editing locally while the server
    turns their writes away, and their canvas quietly stops matching everyone else's
  */
  const readonly = ref(false);
  const isReadonly = () => readonly.value;

  useCircleResize({ surface, sets, gestures, isReadonly });
  useCircleDrag({ surface, sets, gestures, theme, isReadonly });

  const transit = createSetsTransit({ sets, queries, annotations, surface });

  const product: ProductControls = {
    surface,
    annotations,
    transit: { ...transit, compression: setsTransitCompression },
    history: createSetsHistory({ sets, annotations, gestures }),
    isContent: ({ id }) => sets.hasDefinition(id),
    onAppearanceChanged: (color) => theme.setActivePreset(color),
    multiplayer: {
      bind: (doc, mode) =>
        bindSetsToDoc({ sets, annotations, gestures }, doc, mode),
      drag: trackDraggedSets({ sets, gestures }),
      tiers: {
        host: {},
        admin: {},
        write: {},
        read: {
          enter: () => (readonly.value = true),
          exit: () => (readonly.value = false),
        },
      },
    },
  };

  const shell = useShell(product, {
    productId: 'sets',
    helpMenu: [
      {
        id: 'sets/create-set',
        category: 'Sets',
        name: 'Create Set',
        gesture: 'dblclick',
      },
    ],
    onboarding: SETS_ONBOARDING,
    onSetupCompleted: () => {
      if (sets.definitions.value.length > 0) shell.onboarding?.close();
    },
  });

  sets.events.subscribe('onDefinitionsChanged', shell.localStorage.invalidate);
  sets.events.subscribe('onDisplayChanged', shell.localStorage.invalidate);
  queries.events.subscribe('onQueriesChanged', shell.localStorage.invalidate);
  annotations.events.subscribe(
    'onAnnotationsChanged',
    shell.localStorage.invalidate,
  );

  sets.events.subscribe('onDefinitionsChanged', () =>
    shell.onboarding?.close(),
  );

  const setsState: SetsState = {
    queries,
    sets,
    queryAnalysis: useQueryAnalysis(queries, sets, sections),
    theme,
    sections,
    focus,
    isReadonly: computed(() => readonly.value),
  };

  useCanvasAppearance(surface, theme);

  provideSetsState(setsState);

  shell.componentSlots.add({
    id: 'sets/query-panel',
    component: QueryPanel,
    position: 'bottom-middle',
  });

  return { shell, setsState };
};
