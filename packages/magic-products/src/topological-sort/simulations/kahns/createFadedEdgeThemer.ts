import { Color } from '@core/utils/colors';
import { CoreEdge } from '@graph/primitives/types';
import { GEdge, Graph } from '@magic/shared/graph';
import tinycolor from 'tinycolor2';

const FADED_ALPHA = 0.35;

export const createFadedEdgeThemer = (graph: Graph) => {
  let fadedIds = new Set<GEdge['id']>();

  const fade = (edge: CoreEdge, resolveUnderneath: () => Color) => {
    if (!fadedIds.has(edge.id)) return;
    return tinycolor(resolveUnderneath()).setAlpha(FADED_ALPHA).toHex8String();
  };

  return {
    themer: graph.theme.createThemer({
      surface: {
        'edge.default.color': fade,
        'edge.hover.color': fade,
      },
    }),
    setIds: (ids: readonly GEdge['id'][]) => {
      fadedIds = new Set(ids);
    },
  };
};
