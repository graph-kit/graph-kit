import { GraphGetters } from '@graph/primitives/getters/types';
import { CoreEdge, CoreNode } from '@graph/primitives/types';

import { CoreGetters } from '../getters.ts';
// referenced only by a {@link} below, which no-unused-vars does not see
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { CoreOptions } from '../options.ts';
import { CoreControls } from '../types.ts';

export type EdgeHelpers = {
  /**
   * a {@link CoreOptions.directed | options.isGraphDirected} aware predicate returning `true` if provided {@link CoreEdge | edge} directs into provided {@link CoreNode | node}
   */
  isPointingTowardNode: (
    edgeId: CoreEdge['id'],
    nodeId: CoreNode['id'],
  ) => boolean;
  /**
   * a {@link CoreOptions.directed | options.isGraphDirected} aware predicate returning `true` if provided {@link CoreEdge | edge} directs from provided {@link CoreNode | node} to any other {@link CoreNode | node}
   */
  isPointingAwayFromNode: (
    edgeId: CoreEdge['id'],
    nodeId: CoreNode['id'],
  ) => boolean;
};

export type NodeHelpers = {
  /**
   * a {@link CoreOptions.directed | options.isGraphDirected} aware getter for all parents of the provided {@link CoreNode | node}
   *
   * ℹ️ a {@link CoreNode | nodes} parents are all {@link CoreNode | nodes} that connect directly to it
   */
  getParents: (nodeId: CoreNode['id']) => CoreNode[];
  /**
   * a {@link CoreOptions.directed | options.isGraphDirected} aware getter for all children of the provided {@link CoreNode | node}
   *
   * ℹ️ a {@link CoreNode | nodes} children are all {@link CoreNode | nodes} that this {@link CoreNode | node} connects directly to
   */
  getChildren: (nodeId: CoreNode['id']) => CoreNode[];
  /**
   * gets all {@link CoreEdge | edges} that are attached to the provided {@link CoreNode | node}, regardless of {@link CoreEdge | edge} direction
   *
   * ⚠️ not {@link CoreOptions.directed | options.isGraphDirected} aware
   */
  getConnectedEdges: (nodeId: CoreNode['id']) => CoreEdge[];
  /**
   * a {@link CoreOptions.directed | options.isGraphDirected} aware getter returning all {@link CoreEdge | edges} connecting into provided {@link CoreNode | node}
   */
  getInboundEdges: (nodeId: CoreNode['id']) => CoreEdge[];
  /**
   * a {@link CoreOptions.directed | options.isGraphDirected} aware getter returning all {@link CoreEdge | edges} provided {@link CoreNode | node} connects to
   */
  getOutboundEdges: (nodeId: CoreNode['id']) => CoreEdge[];
  /**
   * gets the edges connecting two nodes
   *
   * ⚠️ not {@link CoreOptions.directed | options.isGraphDirected} aware
   *
   * ‼️ this getter is only for {@link CoreNode | nodes} that are directly linked together (ie a distance of 1 from each other)
   */
  getEdgesBetweenConnectedNodes: (
    node1Id: CoreNode['id'],
    node2Id: CoreNode['id'],
  ) => readonly CoreEdge[];
  /**
   * a {@link CoreOptions.directed | options.isGraphDirected} aware getter that returns the edge linking a source node to a target node
   *
   * ℹ️ if the graph is undirected, this will return the edge regardless of whether it originates from `sourceNodeId` or `targetNodeId`
   */
  getEdgeBetween: (
    sourceNodeId: CoreNode['id'],
    targetNodeId: CoreNode['id'],
  ) => CoreEdge | undefined;
};

type FieldsNeededFromCoreGraph = 'edges' | 'metadata';

export type CoreGraphForHelpers = Pick<
  CoreControls,
  FieldsNeededFromCoreGraph
> &
  GraphGetters<CoreGetters>;

export type CurryWithCoreGraph<Helpers> = {
  [Key in keyof Helpers]: (graph: CoreGraphForHelpers) => Helpers[Key];
};

export type CoreGraphHelpers = {
  edges: EdgeHelpers;
  nodes: NodeHelpers;
};
