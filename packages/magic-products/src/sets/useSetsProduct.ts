import { useCanvasSurface } from '@canvas/surface/index';
import { canvasCursorOverride } from '@core/themes/index';
import { nullThrows } from '@core/utils/assert';
import { ProductControls, Shell, useShell } from '@magic/shared/product';

import { ComputedRef, inject, provide } from 'vue';

import QueryPanel from './components/QueryPanel.vue';
import { useSections } from './composables/useSections.ts';
import {
  type SetFocusControls,
  useSetFocus,
} from './composables/useSetFocus.ts';
import { SETS_ONBOARDING } from './onboarding.ts';
import { type Queries, createQueries } from './queries.ts';
import { type QueryAnalysis, useQueryAnalysis } from './queryAnalysis.ts';
import { type SetDefinitions, createSetDefinitions } from './setDefinitions.ts';
import { useCanvasAppearance } from './theme/useCanvasAppearance.ts';
import { type SetsTheme, useSetsTheme } from './theme/useSetsTheme.ts';
import { Section } from './types.ts';

export type SetsProductState = {
  queries: Queries;
  sets: SetDefinitions;
  // everything the queries resolve to once read against the set space
  queryAnalysis: QueryAnalysis;
  theme: SetsTheme;
  sections: ComputedRef<Section[]>;
  focus: SetFocusControls;
};

const SETS_PROVIDE_KEY = 'sets-product';

const provideSetsProductState = (state: SetsProductState) => {
  provide(SETS_PROVIDE_KEY, state);
};

export const useProvidedSetsProductState = () => {
  return nullThrows(
    inject<SetsProductState>(SETS_PROVIDE_KEY),
    'sets product state not provided!',
  );
};

export const useSetsProduct = () => {
  const theme = useSetsTheme();

  const surface = useCanvasSurface({
    // the fallback sentinel is a theme concept, spent here rather than taught to the surface
    canvasCursor: () =>
      canvasCursorOverride(theme._resolveToken('canvas.cursor')),
  });

  const sets = createSetDefinitions();
  const queries = createQueries();
  const sections = useSections(sets.definitions);
  const focus = useSetFocus({ surface });

  // sets has no serializable state yet, so there is nothing to mirror either way. it
  // is not flagged multiplayer, and giving it real transit is what would unblock both,
  // along with the local storage and link sharing that transit gates.
  const host: ProductControls = {
    surface,
    onAppearanceChanged: (color) => theme.setActivePreset(color),
    multiplayer: {
      bind: () => {},
      // nothing to hold down: sets is not flagged multiplayer and has no state to write
      tiers: {
        host: {},
        admin: {},
        write: {},
        read: {},
      },
    },
  };

  const shell = useShell(host, {
    productId: 'sets',
    // MainView subscribes this to onDblClick
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

  const setsProductState: SetsProductState = {
    queries,
    sets,
    queryAnalysis: useQueryAnalysis(queries, sets, sections),
    theme,
    sections,
    focus,
  };

  useCanvasAppearance(surface, theme);

  provideSetsProductState(setsProductState);

  shell.componentSlots.add({
    id: 'sets/query-panel',
    component: QueryPanel,
    position: 'bottom-middle',
  });

  return { shell, setsProductState };
};
