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
  excludingEdges?: readonly GEdge['id'][];
};

export type PrimsFrame = PrimsStep & PrimsState & PrimsHighlights;

export type KruskalsFunction = (
  graph: Graph,
) => FrameCollectorFn<KruskalsFrame>;

// every edge is sorted by weight, cheapest first, into the list of edges each
// waiting for its turn
type KruskalsStartFrame = {
  type: 'start';
};

type KruskalsEndFrame = {
  type: 'end';
};

// the cheapest edge left, up for a decision
type ConsiderEdgeFrame = {
  type: 'consider-edge';
  edge: GEdge['id'];
};

// the edge connects two components that were still separate, so it grows the forest
type AcceptEdgeFrame = {
  type: 'accept-edge';
  edge: GEdge['id'];
};

// both ends of the edge already sit in the same component, so taking it would
// only close a loop
type ExcludeEdgeFrame = {
  type: 'exclude-edge';
  edge: GEdge['id'];
};

type KruskalsUnreachableFrame = {
  type: 'unreachable';
  nodes: readonly GNode['id'][];
};

export type KruskalsStep =
  | KruskalsStartFrame
  | KruskalsEndFrame
  | ConsiderEdgeFrame
  | AcceptEdgeFrame
  | ExcludeEdgeFrame
  | KruskalsUnreachableFrame;

type KruskalsState = {
  treeNodeIds: readonly GNode['id'][];
  treeEdgeIds: readonly GEdge['id'][];
  excludedEdgeIds: readonly GEdge['id'][];
  candidateEdges: readonly GEdge['id'][];
};

export type KruskalsHighlights = {
  activeNodeIds?: readonly GNode['id'][];
  selectedEdge?: GEdge['id'];
};

export type KruskalsFrame = KruskalsStep & KruskalsState & KruskalsHighlights;
