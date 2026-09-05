import { GraphPlugin } from '@graph/plugins-shared/plugins';
import type { CoreEdge } from '@graph/primitives/types';
import Fraction from 'fraction.js';

/** an edge of a spanning tree, carrying the weight it was ranked by */
export type MstEdge = CoreEdge & {
  weight: Fraction;
};

export type MinimumSpanningTreesResult =
  | {
      skipped: false;
      /** every MST of the graph, or every minimum spanning forest when disconnected */
      msts: MstEdge[][];
      /** the weight shared by every entry in `msts` */
      totalWeight: Fraction;
      /** whether the returned trees span every node, false for a forest */
      connected: boolean;
    }
  /** the graph was larger than the plugin's `maxNodes`, so nothing was enumerated */
  | { skipped: true };

/** a single MST of the graph, or a single minimum spanning forest when disconnected */
export type SingleMst = {
  /** the ids of the edges making up the tree */
  edges: CoreEdge['id'][];
  /** the total weight of those edges */
  cost: Fraction;
};

export type MinimumSpanningTreesControls = {
  /** every MST of the graph, unless the graph was too large to enumerate */
  all: () => MinimumSpanningTreesResult;
  /**
   * a single MST of the graph, or a single minimum spanning forest when
   * disconnected
   */
  one: () => SingleMst;
};

export type MinimumSpanningTreesPlugin = GraphPlugin<{
  name: 'minimumSpanningTrees';
  controls: MinimumSpanningTreesControls;
}>;
