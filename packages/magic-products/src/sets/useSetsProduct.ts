import { useCanvasSurface } from '@canvas/surface/index';
import { nullThrows } from '@core/utils/assert';
import { ProductControls, Shell, useShell } from '@magic/shared/product';

import { ComputedRef, inject, provide } from 'vue';

import TemporaryOnboarding from './TemporaryOnboarding.vue';
import { SETS_ONBOARDING } from './onboarding.ts';
import { type Queries, createQueries } from './queries.ts';
import { type QueryAnalysis, useQueryAnalysis } from './queryAnalysis.ts';
import { type SetDefinitions, createSetDefinitions } from './setDefinitions.ts';
import QueryPanel from './sets/components/QueryPanel.vue';
import { useSections } from './sets/composables/useSections.ts';
import { Section } from './types.ts';
import { useCanvasTheme } from './useCanvasTheme.ts';
import { SetsTheme, useSetsTheme } from './useSetsTheme.ts';

export type SetsProductState = {
  queries: Queries;
  sets: SetDefinitions;
  // everything the queries resolve to once read against the set space
  queryAnalysis: QueryAnalysis;
  theme: ComputedRef<SetsTheme>;
  sections: ComputedRef<Section[]>;
};

const useSetsProductState = (
  shell: Shell,
  sets: SetDefinitions,
): SetsProductState => {
  const queries = createQueries();
  const theme = useSetsTheme(shell);
  const sections = useSections(sets.definitions);

  return {
    queries,
    sets,
    queryAnalysis: useQueryAnalysis(queries, sets, sections),
    theme,
    sections,
  };
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
  const surface = useCanvasSurface();

  // stood up ahead of the shell so the product can be built around it either side
  const sets = createSetDefinitions();

  // sets has no serializable state yet, so there is nothing to mirror either way. it
  // is not flagged multiplayer, and giving it real transit is what would unblock both,
  // along with the local storage and link sharing that transit gates.
  const host: ProductControls = {
    surface,
    onAppearanceChanged: () => {},
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

  const setsProductState = useSetsProductState(shell, sets);
  useCanvasTheme(shell, setsProductState);

  provideSetsProductState(setsProductState);

  shell.componentSlots.add({
    id: 'sets/query-panel',
    component: QueryPanel,
    position: 'bottom-middle',
  });

  shell.componentSlots.add({
    id: 'sets/onboarding',
    component: TemporaryOnboarding,
    position: 'top-middle',
  });

  return { shell, setsProductState };
};
