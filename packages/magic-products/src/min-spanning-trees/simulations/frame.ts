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

// comparing two edges to see which is cheaper
type CompareEdgesFrame = {
  type: 'compare-edges';
  left: GEdge['id'];
  right: GEdge['id'];
};

// the edge that was chosen to grow the tree
type SelectEdgeFrame = {
  type: 'select-edge';
  edge: GEdge['id'];
  node: GNode['id'];
  tiedEdges?: readonly GEdge['id'][];
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
  | CompareEdgesFrame
  | SelectEdgeFrame
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
  currentComparison?: readonly GEdge['id'][];
  selectedEdge?: GEdge['id'];
};

export type PrimsFrame = PrimsStep & PrimsState & PrimsHighlights;
