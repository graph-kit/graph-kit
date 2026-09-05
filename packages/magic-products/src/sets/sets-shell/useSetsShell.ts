import { useCanvasSurface } from '@canvas/surface/index';
import { canvasCursorOverride } from '@core/themes/index';
import { ProductControls, Shell, useShell } from '@magic/shared/product';

import QueryPanel from '../components/QueryPanel.vue';
import { useCircleDrag } from '../composables/useCircleDrag.ts';
import { useCircleResize } from '../composables/useCircleResize.ts';
import { useSections } from '../composables/useSections.ts';
import { useSetFocus } from '../composables/useSetFocus.ts';
import { useSetsAnnotations } from '../composables/useSetsAnnotations.ts';
import { createQueries } from '../queries.ts';
import { useQueryAnalysis } from '../queryAnalysis.ts';
import { createSetDefinitions } from '../setDefinitions.ts';
import { useCanvasAppearance } from '../theme/useCanvasAppearance.ts';
import { useSetsTheme } from '../theme/useSetsTheme.ts';
import { provideSetsState } from './context.ts';
import { SETS_ONBOARDING } from './onboarding.ts';
import { SetsState } from './types.ts';

/** adapts sets to the shell's controls interface, see {@link useShell} */
export const useSetsShell = (): {
  shell: Shell;
  setsState: SetsState;
} => {
  const theme = useSetsTheme();

  const surface = useCanvasSurface({
    // the fallback sentinel is a theme concept, spent here rather than taught to the surface
    canvasCursor: () =>
      canvasCursorOverride(theme._resolveToken('canvas.cursor')),
  });

  const annotations = useSetsAnnotations({ surface, theme });

  const sets = createSetDefinitions();
  const queries = createQueries();
  const sections = useSections(sets.definitions);
  const focus = useSetFocus({ surface });

  /*
    the gestures stand up here rather than in the view because what a room broadcasts as a
    drag is driven by them, and that hub has to exist before the shell is built
  */
  useCircleResize({ surface, sets });
  useCircleDrag({ surface, sets, theme });

  // no transit, so no: multiplayer, local storage and link sharing
  const product: ProductControls = {
    surface,
    annotations,
    onAppearanceChanged: (color) => theme.setActivePreset(color),
    multiplayer: {
      bind: () => {},
      tiers: {
        host: {},
        admin: {},
        write: {},
        read: {},
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
  });

  const setsState: SetsState = {
    queries,
    sets,
    queryAnalysis: useQueryAnalysis(queries, sets, sections),
    theme,
    sections,
    focus,
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
