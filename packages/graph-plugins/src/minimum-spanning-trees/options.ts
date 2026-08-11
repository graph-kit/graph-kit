export type MinimumSpanningTreesOptions = {
  /**
   * the graph size past which enumeration is refused rather than attempted.
   *
   * the number of minimum spanning trees is exponential in the vertex count, so going
   * over this is not a slow case that eventually returns. measured on a graph of 1.5
   * edges per node, 15 nodes lands around 300ms, 17 around 1.6s, and 20 does not finish.
   *
   * raise it if a product genuinely needs more and can afford to block on it, keeping in
   * mind that each extra node is roughly a doubling
   * @default 15
   */
  maxNodes: number;
};

export const DEFAULT_MINIMUM_SPANNING_TREES_OPTIONS: MinimumSpanningTreesOptions =
  {
    maxNodes: 15,
  };
