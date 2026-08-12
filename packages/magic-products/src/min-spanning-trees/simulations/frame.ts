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

// considering every edge connecting the tree to a node outside of it
type ConsiderEdgesFrame = {
  type: 'consider-edges';
  edges: readonly GEdge['id'][];
};

// the edge that was chosen to grow the tree
type SelectEdgeFrame = {
  type: 'select-edge';
  edge: GEdge['id'];
  node: GNode['id'];
  tiedEdges?: readonly GEdge['id'][];
};

// the edges about to be ruled out, called out (but not yet faded) so the
// "why" reads before the "then it's gone"
type ExcludingEdgesFrame = {
  type: 'excluding-edges';
  edges: readonly GEdge['id'][];
};

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
  | SelectEdgeFrame
  | ExcludingEdgesFrame
  | ExcludeEdgesFrame
  | UnreachableFrame;

type PrimsState = {
  treeNodeIds: readonly GNode['id'][];
  treeEdgeIds: readonly GEdge['id'][];
  excludedEdgeIds: readonly GEdge['id'][];
  anchorNodeId: GNode['id'];
};

export type PrimsHighlights = {
  activeNodeId?: GNode['id'];
  pendingNodeIds?: readonly GNode['id'][];
  candidateEdges?: readonly GEdge['id'][];
  selectedEdge?: GEdge['id'];
  // edges called out as about-to-be-excluded, before excludedEdgeIds picks
  // them up and they fade
  excludingEdges?: readonly GEdge['id'][];
};

export type PrimsFrame = PrimsStep & PrimsState & PrimsHighlights;

export type KruskalsFunction = (
  graph: Graph,
) => FrameCollectorFn<KruskalsFrame>;

type KruskalsStartFrame = {
  type: 'start';
  sortedEdges: readonly GEdge['id'][];
};

type KruskalsEndFrame = {
  type: 'end';
};

// the next cheapest edge in sorted order, up for a decision
type ConsiderEdgeFrame = {
  type: 'consider-edge';
  edge: GEdge['id'];
};

// the edge connects two components that were still separate, so it grows the forest
type AcceptEdgeFrame = {
  type: 'accept-edge';
  edge: GEdge['id'];
};

// both ends of the edge are already in the same component, so it would only close a loop
type RejectEdgeFrame = {
  type: 'reject-edge';
  edge: GEdge['id'];
};

type KruskalsUnreachableFrame = {
  type: 'unreachable';
  nodes: readonly GNode['id'][];
};

// the tree already spans every node before every edge got a turn, so the
// remaining, never-considered edges are waved off all at once
type AllConnectedFrame = {
  type: 'all-connected';
  edges: readonly GEdge['id'][];
};

export type KruskalsStep =
  | KruskalsStartFrame
  | KruskalsEndFrame
  | ConsiderEdgeFrame
  | AcceptEdgeFrame
  | RejectEdgeFrame
  | KruskalsUnreachableFrame
  | AllConnectedFrame;

type KruskalsState = {
  treeNodeIds: readonly GNode['id'][];
  treeEdgeIds: readonly GEdge['id'][];
  excludedEdgeIds: readonly GEdge['id'][];
};

export type KruskalsHighlights = {
  activeEdgeId?: GEdge['id'];
  activeNodeIds?: readonly GNode['id'][];
  // the edge called out as about-to-be-excluded, before excludedEdgeIds
  // picks it up and it fades
  excludingEdgeId?: GEdge['id'];
};

export type KruskalsFrame = KruskalsStep & KruskalsState & KruskalsHighlights;
