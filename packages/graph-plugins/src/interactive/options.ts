import { MaybeGetter } from '@core/utils/maybeGetter/index';
import Fraction from 'fraction.js';

export type InteractiveOptions = {
  /**
   * the weight given to an edge created by dropping a node anchor onto another node
   * @default 1
   */
  newEdgeWeight: MaybeGetter<Fraction | number>;
  /**
   * parses user input into an {@link CoreEdge.weight | edge weight}. returning
   * undefined rejects the input and leaves the weight as it was
   */
  parseEdgeWeight: (input: string) => Fraction | undefined;
  /**
   * whether a node may be given an edge to itself.
   * relevant on directed graphs, where a self loop is a meaningful edge
   * @default true
   */
  allowSelfLoops: boolean;
  /**
   * whether an edge may be added between two nodes that are already connected.
   * connection is direction agnostic, so with this off an existing A to B edge also
   * blocks B to A. on, the graph still refuses a second edge along a path it already
   * carries, since multigraphs are not supported
   * @default true
   */
  allowRepeatConnections: boolean;
  /**
   * whether interactive records the mutations it makes to history, when the history
   * plugin is installed and enabled
   * @default true
   */
  recordHistory: boolean;
};

export const DEFAULT_INTERACTIVE_OPTIONS: InteractiveOptions = {
  parseEdgeWeight: (input: string) => {
    try {
      return new Fraction(input);
    } catch {
      // fraction throws if the input cannot be parsed or is a divide by zero.
      // returning undefined is how a rejected weight is reported
    }
  },
  newEdgeWeight: 1,
  allowSelfLoops: true,
  allowRepeatConnections: true,
  recordHistory: true,
};
