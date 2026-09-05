import { ComputedRef } from 'vue';

import { SetFocusControls } from '../composables/useSetFocus.ts';
import { Queries } from '../queries.ts';
import { QueryAnalysis } from '../queryAnalysis.ts';
import { SetDefinitions } from '../setDefinitions.ts';
import { SetsTheme } from '../theme/useSetsTheme.ts';
import { Section } from '../types.ts';

export type SetsState = {
  queries: Queries;
  sets: SetDefinitions;
  // everything the queries resolve to once read against the set space
  queryAnalysis: QueryAnalysis;
  theme: SetsTheme;
  sections: ComputedRef<Section[]>;
  focus: SetFocusControls;
};
