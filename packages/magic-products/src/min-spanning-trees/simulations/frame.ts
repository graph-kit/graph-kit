import { GEdge, GNode, Graph } from '@magic/shared/graph';
import { FrameCollectorFn } from '@magic/shared/simulation/types';

export type PrimsFunction = (
  graph: Graph,
  startNodeId: GNode['id'],
) => FrameCollectorFn<PrimsFrame>;

type StartFrame = {
  type: 'start';
};

type EndFrame = {
  type: 'end';
};

// every edge with one end in the tree and one end outside it is eligible
type ConsiderEdgesFrame = {
  type: 'consider-edges';
};

// the cheapest of the eligible edges, which grows the tree by one node
type SelectEdgeFrame = {
  type: 'select-edge';
  edge: GEdge['id'];
  tiedEdges?: readonly GEdge['id'][];
};

// the new node put both ends of these edges in the tree, so taking any of them
// would only close a loop
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
  | ExcludeEdgesFrame
  | UnreachableFrame;

type PrimsState = {
  treeNodeIds: readonly GNode['id'][];
  treeEdgeIds: readonly GEdge['id'][];
  excludedEdgeIds: readonly GEdge['id'][];
  candidateEdges: readonly GEdge['id'][];
  anchorNodeId: GNode['id'];
};

export type PrimsHighlights = {
  activeNodeIds?: readonly GNode['id'][];
  selectedEdge?: GEdge['id'];
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
