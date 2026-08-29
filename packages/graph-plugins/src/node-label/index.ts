import { createLabelGenerator } from '@core/utils/label';
import { getValue } from '@core/utils/maybeGetter/index';
import { createLifecycle } from '@graph/plugins-shared/lifecycle';
import { reactiveMap } from '@reactive/primitives/index';

import { UPPERCASE_ALPHABET } from './constants.ts';
import { createLabelThemer } from './createLabelThemer.ts';
import { NodeLabelControls, NodeLabelPlugin } from './types.ts';

export const nodeLabel: NodeLabelPlugin = ({
  controls,
  events,
  actions,
  getters,
}) => {
  // reactiveMap rather than Map: getNode below reads it, and nodes/edges are computeds
  // over the getters, so this read is what ties a label change to a recompute
  const nodeIdToLabel = reactiveMap<string, string>();

  const getNodeLabel: NodeLabelControls['get'] = (nodeId: string) =>
    nodeIdToLabel.get(nodeId);

  const setNodeLabels: NodeLabelControls['setMany'] = (labels) => {
    const result = labels.map(({ nodeId, label: labelOrLabelGetter }) => {
      const currentLabel = getNodeLabel(nodeId);
      const label = getValue(labelOrLabelGetter, currentLabel);
      nodeIdToLabel.set(nodeId, label);
      return { nodeId, label };
    });
    return result;
  };

  const generateLabel = createLabelGenerator({
    getLabels: () =>
      controls
        .nodes()
        .map((n) => getNodeLabel(n.id))
        .filter((label): label is string => label !== undefined),
    sequence: UPPERCASE_ALPHABET,
  });

  const themer = createLabelThemer(controls, getNodeLabel);

  const lifecycle = createLifecycle({
    onEnable: themer.enable,
    onDisable: themer.disable,
  });

  lifecycle.enable();

  return {
    name: 'nodeLabel',
    events,
    transit: {
      encode: () =>
        Array.from(nodeIdToLabel).map(([nodeId, label]) => ({
          nodeId,
          label,
        })),
      decode: (data) => {
        nodeIdToLabel.clear();
        setNodeLabels(data);
      },
      validate: (data) => true,
    },
    getters: {
      ...getters,
      getNode: (id) => {
        const node = getters.getNode(id);
        const label = getNodeLabel(node.id) ?? '?';
        return { ...node, label };
      },
    },
    actions: {
      ...actions,
      addNode: (options) => {
        const node = actions.addNode(options);
        if (!node) return;
        setNodeLabels([
          { label: options.label ?? generateLabel(), nodeId: node.id },
        ]);
        return node;
      },
      removeNode: (options) => {
        const removalPayload = actions.removeNode(options);
        nodeIdToLabel.delete(options.id);
        return removalPayload;
      },
      addElements: (options) => {
        const addedElements = actions.addElements(options);
        setNodeLabels(
          addedElements.addedNodes.map((node, i) => ({
            nodeId: node.id,
            label: options.nodes?.[i]?.label ?? generateLabel(),
          })),
        );
        return addedElements;
      },
      removeElements: (options) => {
        const removedElements = actions.removeElements(options);
        for (const nodeId of removedElements.removedNodeIds) {
          nodeIdToLabel.delete(nodeId);
        }
        return removedElements;
      },
    },
    controls: {
      get: getNodeLabel,
      set: (label) => setNodeLabels([label]),
      setMany: setNodeLabels,
      lifecycle,
      _internal: {
        nodeIdToLabel,
      },
    },
  };
};
