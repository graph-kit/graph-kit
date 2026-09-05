import { MinimumSpanningTreesControls } from '@graph/plugins/minimum-spanning-trees/types';

import { useSignals } from './utils/useSignal.ts';

export const useMinimumSpanningTrees = (msts: MinimumSpanningTreesControls) =>
  useSignals({
    all: msts.all,
    one: msts.one,
  });
