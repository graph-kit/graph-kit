import { nullThrows } from '@core/utils/assert';
import { generateId } from '@core/utils/id';

import { CreateCoreAction } from '../../types.ts';

export const createAddNodeHandler: CreateCoreAction<'addNode'> =
  ({ graph, commitTransaction }) =>
  (node) => {
    const newNode = { id: generateId(), ...node };

    const { addedNodes } = commitTransaction({ addNodes: [newNode] });

    // a refusal is the transaction's to report and the caller's to handle
    const telemetryNode = addedNodes[0];
    if (!telemetryNode) return undefined;

    const liveNode = nullThrows(
      graph.nodes().find((n) => n.id === telemetryNode.id),
      '[Graph Actions] Node creation succeeded but entity was not found in live state.',
    );

    return liveNode;
  };
