import { ComputedTokenResolver } from '@graph/computed-tokens/index';
import { getEdgesBetweenConnectedNodes } from '@graph/core/helpers/node';
import { CoreEdge } from '@graph/primitives/types';
import {
  EdgeLayoutOptions,
  EdgeRenderOptionsSource,
  createDefaultEdgeRenderOptions,
  createEdgeRenderFunction,
} from '@graph/render-functions/index';
import { getNeighborPositions } from '@graph/render-functions/utils/getNeighborPositions';

import { PhantomControls } from './types.ts';

/**
 * the slice of a graph running the {@link phantom} plugin this renderer reads from.
 * structural so the graph itself can be handed straight in.
 */
export type PhantomAwareGraph = Pick<
  EdgeRenderOptionsSource,
  'surface' | 'metadata'
> & {
  theme: { tokenResolver: ComputedTokenResolver };
  phantom: Pick<PhantomControls, 'edges' | 'getNodePosition'>;
  getEdges: () => readonly CoreEdge[];
};

// the default edge renderer will not work with the phantom plugin since edge rendering requires
// graph context (like other nodes and edges around it) to work properly.
// IE for base edges to render properly alongside phantom edges, they must be able to see phantom edges and vice versa
export const createPhantomAwareEdgeRenderFunction = (
  graph: PhantomAwareGraph,
  layout?: EdgeLayoutOptions & {
    // TODO temporary. will be replaced by node/edge render registry
    // https://github.com/graph-kit/graph-kit/issues/813
    phantomOnly?: boolean;
  },
) => {
  const allEdges = (): readonly CoreEdge[] => [
    ...(layout?.phantomOnly ? [] : graph.getEdges()),
    ...graph.phantom.edges(),
  ];

  return createEdgeRenderFunction({
    ...createDefaultEdgeRenderOptions({
      surface: graph.surface,
      metadata: graph.metadata,
      resolveToken: graph.theme.tokenResolver,
    }),
    parallelEdges: (edge) => {
      const connectedEdges = getEdgesBetweenConnectedNodes(allEdges());
      return connectedEdges(edge.source.id, edge.target.id);
    },
    neighborPositions: (edge) =>
      getNeighborPositions(edge, allEdges(), graph.phantom.getNodePosition),
    layout: {
      ...layout,
      labelled: layout?.labelled ?? graph.metadata.weighted,
    },
  });
};
