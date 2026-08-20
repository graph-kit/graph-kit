import { MaybeGetter } from '@core/utils/maybeGetter/index';
import { GraphPlugin, WithLifecycle } from '@graph/plugins-shared/plugins';

import { FocusPlugin } from '../focus/types.ts';
import { SurfacePlugin } from '../surface/types.ts';

export type NodeLabelEntry = {
  nodeId: string;
  label: string;
};

export type NodeLabelUpdate = {
  nodeId: string;
  label: MaybeGetter<string, [string | undefined]>;
};

export type NodeLabelControls = {
  /** Returns the label of a node. */
  get: (nodeId: string) => string | undefined;
  /** Updates a single node's label. */
  set: (label: NodeLabelUpdate) => void;
  /** Updates multiple nodes' labels. */
  setMany: (labels: NodeLabelUpdate[]) => NodeLabelEntry[];
  /** @internal */
  _internal: {
    nodeIdToLabel: Map<string, string>;
  };
};

type LabelOption = {
  label: string;
};

type NodeLabelActions = {
  addNode: Partial<LabelOption>;
  addElements: {
    nodes: Partial<LabelOption>;
  };
};

type NodeLabelGetters = {
  getNode: LabelOption;
};

type NodeLabelEncode = {
  nodeId: string;
  label: string;
};

export type NodeLabelPlugin = GraphPlugin<{
  name: 'nodeLabel';
  controls: WithLifecycle<NodeLabelControls>;
  actions: NodeLabelActions;
  getters: NodeLabelGetters;
  transit: NodeLabelEncode[];
  dependsOn: [SurfacePlugin];
  optionalDependsOn: [FocusPlugin];
}>;
