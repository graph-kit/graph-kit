import { Coordinate } from '@canvas/primitives/types/utility';
import { GraphPlugin } from '@graph/plugins-shared/plugins';
import { ElementRemovalPayload } from '@graph/primitives/transactions/types';
import { CoreEdge, CoreNode } from '@graph/primitives/types';

import { FocusPlugin } from '../focus/types.ts';
import { SurfacePlugin } from '../surface/types.ts';

export type PhantomElements = {
  nodes: PhantomNode[];
  edges: PhantomEdge[];
};

export type PhantomElementIds = {
  nodeIds: CoreNode['id'][];
  edgeIds: CoreEdge['id'][];
};

export type PhantomControls = {
  /** adds a node the graph draws but does not contain */
  addNode: (node: PhantomNode) => void;
  /** adds an edge the graph draws but does not contain */
  addEdge: (edge: PhantomEdge) => void;
  /** bulk adds phantom nodes and edges */
  addElements: (elements: PhantomElements) => void;
  /**
   * removes a phantom node.
   *
   * ℹ️ **Note:** this implicitly removes any phantom edges attached to it.
   * @returns everything that was removed
   */
  removeNode: (nodeId: CoreNode['id']) => ElementRemovalPayload;
  /** removes a phantom edge */
  removeEdge: (edgeId: CoreEdge['id']) => void;
  /**
   * bulk removes phantom nodes and edges.
   *
   * ℹ️ **Note:** if a node is in this batch, the phantom edges attached to it go too.
   * @returns everything that was removed
   */
  removeElements: (elements: PhantomElementIds) => ElementRemovalPayload;
  /**
   * removes every phantom node.
   *
   * ℹ️ **Note:** this implicitly removes the phantom edges attached to them.
   * @returns everything that was removed
   */
  removeAllNodes: () => ElementRemovalPayload;
  /**
   * removes every phantom edge, leaving the phantom nodes in place
   * @returns everything that was removed
   */
  removeAllEdges: () => ElementRemovalPayload;
  /**
   * removes every phantom node and edge
   * @returns everything that was removed
   */
  removeAllElements: () => ElementRemovalPayload;
  /** the phantom nodes only, the graph's own nodes are not included */
  nodes: () => readonly PhantomNode[];
  /** the phantom edges only, the graph's own edges are not included */
  edges: () => readonly PhantomEdge[];
  /** whether the id belongs to a phantom node, the graph's own nodes report false */
  isNode: (id: string) => boolean;
  /** whether the id belongs to a phantom edge, the graph's own edges report false */
  isEdge: (id: string) => boolean;
  /** position of any node the graph draws, phantom or real */
  getNodePosition: (nodeId: CoreNode['id']) => Readonly<Coordinate>;
};

export type PhantomNode = CoreNode & {
  position: Coordinate;
  label: string;
};

export type PhantomEdge = CoreEdge & {
  label?: string;
};

export type PhantomPlugin = GraphPlugin<{
  name: 'phantom';
  controls: PhantomControls;
  dependsOn: [SurfacePlugin];
  optionalDependsOn: [FocusPlugin];
}>;
