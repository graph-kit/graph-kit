import type { FontWeight } from '@canvas/primitives/text/types';
import { CursorFallback } from '@core/themes/index';
import { Color } from '@core/utils/colors';
import { Cursor } from '@core/utils/cursor';
import { CoreEdge, CoreNode } from '@graph/primitives/types';

export type NodeComputedTokens = {
  'node.color': Color;
  'node.size': number;
  'node.border.color': Color;
  'node.border.width': number;
  'node.cursor': Cursor | CursorFallback;
  'node.text.content': string;
  'node.text.size': number;
  'node.text.color': Color;
  'node.text.fontWeight': FontWeight;
};

export type EdgeComputedTokens = {
  'edge.color': Color;
  'edge.width': number;
  'edge.cursor': Cursor | CursorFallback;
  'edge.text.content': string;
  'edge.text.size': number;
  'edge.text.color': Color;
  'edge.text.fontWeight': FontWeight;
};

/**
 * ordered list of states used to resolve computed tokens.
 * the first active state in the list wins.
 */
export const computedTokenStatePrecedence = [
  'error',
  'focus',
  'disabled',
  'hovered',
  'default',
] as const;

export type ComputedTokenState = (typeof computedTokenStatePrecedence)[number];

/** maps computed node tokens to detector functions. return a value to claim the token, return undefined to defer to the next state in the precedence chain. */
type NodeComputedTokenDetectors = {
  [Token in keyof NodeComputedTokens]?: (
    node: CoreNode,
  ) => NodeComputedTokens[Token] | undefined;
};

/** maps computed edge tokens to detector functions. return a value to claim the token, return undefined to defer to the next state in the precedence chain. */
type EdgeComputedTokenDetectors = {
  [Token in keyof EdgeComputedTokens]?: (
    edge: CoreEdge,
  ) => EdgeComputedTokens[Token] | undefined;
};

export type ComputedTokenDetectorMap = Partial<
  Record<
    ComputedTokenState,
    {
      node?: NodeComputedTokenDetectors;
      edge?: EdgeComputedTokenDetectors;
    }
  >
>;
