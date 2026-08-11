import { getAllMsts } from '@graph/algorithms/minimum-spanning-trees';
import { computed } from '@reactive/primitives/index';

import {
  DEFAULT_MINIMUM_SPANNING_TREES_OPTIONS,
  MinimumSpanningTreesOptions,
} from './options.ts';
import {
  MinimumSpanningTreesPlugin,
  MinimumSpanningTreesResult,
} from './types.ts';

const skipped = (
  nodeCount: number,
  maxNodes: number,
): MinimumSpanningTreesResult => {
  console.warn(
    `minimumSpanningTrees skipped a graph of ${nodeCount} nodes, over its ${maxNodes} node limit. ` +
      'the number of minimum spanning trees is exponential in the node count, so enumerating ' +
      'this graph would block the page rather than take a while. raise the plugin\'s "maxNodes" ' +
      'option to compute more.',
  );

  return { skipped: true };
};

export const minimumSpanningTrees =
  (options: Partial<MinimumSpanningTreesOptions>): MinimumSpanningTreesPlugin =>
  ({ controls }) => {
    const { maxNodes } = {
      ...DEFAULT_MINIMUM_SPANNING_TREES_OPTIONS,
      ...options,
    };

    return {
      name: 'minimumSpanningTrees',
      controls: {
        all: computed(() => {
          const nodes = controls.nodes();
          if (nodes.length > maxNodes) return skipped(nodes.length, maxNodes);

          return {
            ...getAllMsts(
              nodes,
              controls
                .edges()
                .map((e) => ({ ...e, weight: controls.weights.get(e.id) })),
            ),
            skipped: false,
          };
        }),
      },
    };
  };
