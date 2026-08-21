import { ComputedTokenResolver } from '@graph/computed-tokens/index';
import { CoreEdge, CoreNode } from '@graph/primitives/types';

export const createNodeStyleResolver =
  (resolveToken: ComputedTokenResolver) => (node: CoreNode) =>
    ({
      color: resolveToken('node.color', node),
      size: resolveToken('node.size', node),
      border: {
        color: resolveToken('node.border.color', node),
        width: resolveToken('node.border.width', node),
      },
      cursor: resolveToken('node.cursor', node),
      text: {
        content: resolveToken('node.text.content', node),
        fontSize: resolveToken('node.text.size', node),
        color: resolveToken('node.text.color', node),
        fontWeight: resolveToken('node.text.fontWeight', node),
        fontFamily: resolveToken('node.text.fontFamily', node),
      },
    }) as const;

export const createEdgeStyleResolver =
  (resolveToken: ComputedTokenResolver) => (edge: CoreEdge) =>
    ({
      color: resolveToken('edge.color', edge),
      width: resolveToken('edge.width', edge),
      cursor: resolveToken('edge.cursor', edge),
      text: {
        content: resolveToken('edge.text.content', edge),
        fontSize: resolveToken('edge.text.size', edge),
        color: resolveToken('edge.text.color', edge),
        fontWeight: resolveToken('edge.text.fontWeight', edge),
        fontFamily: resolveToken('edge.text.fontFamily', edge),
      },
    }) as const;
