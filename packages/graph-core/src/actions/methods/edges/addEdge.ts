import { nullThrows } from '@core/utils/assert';
import { generateId } from '@core/utils/id';

import { CreateCoreAction } from '../../types.ts';

export const createAddEdgeHandler: CreateCoreAction<'addEdge'> =
  ({ graph, commitTransaction }) =>
  (edge) => {
    const newEdge = { id: generateId(), ...edge };

    const { addedEdges } = commitTransaction({
      addEdges: [newEdge],
    });

    // a refusal is the transaction's to report and the caller's to handle, since what
    // makes an edge unaddable is as often a collaborator as a mistake
    const telemetryEdge = addedEdges[0];
    if (!telemetryEdge) return undefined;

    return nullThrows(
      graph.edges().find((e) => e.id === telemetryEdge.id),
      '[Graph Actions] Edge creation succeeded but entity was not found in live state.',
    );
  };
