import { GEdge, GNode, Graph } from '@magic/shared/graph';
import { FrameCollectorFn } from '@magic/shared/simulation/types';

export type PrimsFunction = (
  graph: Graph,
  startNodeId: GNode['id'],
) => FrameCollectorFn<PrimsFrame>;

type StartFrame = {
  type: 'start';
  start: GNode['id'];
};

type EndFrame = {
  type: 'end';
};

/** every edge connecting a tree node to a non-tree node, announced together as this round's eligible set */
type ConsiderEdgesFrame = {
  type: 'consider-edges';
  edges: readonly GEdge['id'][];
};

/** two candidates being weighed against each other while scanning for the cheapest */
type CompareEdgesFrame = {
  type: 'compare-edges';
  left: GEdge['id'];
  right: GEdge['id'];
};

type SelectEdgeFrame = {
  type: 'select-edge';
  /** the cheapest crossing edge, about to be added to the tree */
  edge: GEdge['id'];
  /** the node it brings in */
  node: GNode['id'];
  /** other crossing edges that tied it on weight, when the cheapest edge was not unique */
  tiedEdges?: readonly GEdge['id'][];
};

/**
 * candidates just ruled out because the node that grew the tree this round
 * closed the loop on them - both ends are now inside the tree without this
 * edge being the one that connected them
 */
type ExcludeEdgesFrame = {
  type: 'exclude-edges';
  edges: readonly GEdge['id'][];
};

type UnreachableFrame = {
  type: 'unreachable';
  nodes: readonly GNode['id'][];
};

export type PrimsStep =
  | StartFrame
  | EndFrame
  | ConsiderEdgesFrame
  | CompareEdgesFrame
  | SelectEdgeFrame
  | ExcludeEdgesFrame
  | UnreachableFrame;

/**
 * the state every frame carries, rebuilt before every step. required rather
 * than optional so a reader does not have to ask whether the run it is
 * watching has a tree yet
 */
type PrimsState = {
  /** nodes already grown into the tree */
  treeNodeIds: readonly GNode['id'][];
  /** edges already grown into the tree */
  treeEdgeIds: readonly GEdge['id'][];
  /**
   * candidates that were considered at some point but can never be picked
   * now - both endpoints ended up in the tree without this edge being the
   * one that connected them, so taking it would only close a cycle. kept
   * apart from `candidateEdges` (still eligible) and `treeEdgeIds` (the
   * answer) so a reader can tell "ruled out" from "not yet reached" - an
   * edge nothing has touched yet stays plain, not faded
   */
  excludedEdgeIds: readonly GEdge['id'][];
  /** the node the user picked to grow the tree from */
  anchorNodeId: GNode['id'];
};

/**
 * what is being looked at this frame rather than what is known. optional
 * because it varies step to step.
 *
 * these mirror the vocabulary prim's is actually specified in: a candidate
 * edge's weight lives on the graph edge itself and never changes here - this
 * is purely bookkeeping about which edges are currently in play, kept
 * separate on purpose so "eligible" (candidateEdges), "being weighed right
 * now" (currentComparison) and "chosen" (selectedEdge) can never be confused
 * with each other or with the edge's actual weight
 */
export type PrimsHighlights = {
  /**
   * the tree-side node the current decision is anchored to - the node whose
   * edge is being taken. this is NOT always the most recently grown node:
   * prim's compares the whole cut at once, so the cheapest edge can come from
   * anywhere the tree already reaches, not just wherever it grew last. undefined
   * while multiple tree nodes are being weighed at once with no single one in
   * play yet
   */
  activeNodeId?: GNode['id'];
  /** nodes on the far end of a candidate edge, not yet in the tree, still being weighed */
  pendingNodeIds?: readonly GNode['id'][];
  /**
   * every edge currently eligible - connects a tree node to a non-tree node.
   * maintained incrementally as the tree grows rather than rescanned from
   * scratch, and stays lit for as long as an edge remains eligible rather
   * than toggling off just because it was not this round's pick - an edge
   * that is still a live candidate should not look like it was ruled out and
   * came back
   */
  candidateEdges?: readonly GEdge['id'][];
  /** the specific edges being weighed against each other this exact step, e.g. [AC, BC] */
  currentComparison?: readonly GEdge['id'][];
  /** the edge ultimately chosen this round */
  selectedEdge?: GEdge['id'];
};

export type PrimsFrame = PrimsStep & PrimsState & PrimsHighlights;
