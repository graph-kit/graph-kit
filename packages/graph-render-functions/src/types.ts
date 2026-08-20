import { AnimatedShapeFactories } from '@canvas/primitives/animation/index';
import { Shape } from '@canvas/primitives/types/index';
import { Coordinate } from '@canvas/primitives/types/utility';
import { Color } from '@core/utils/colors';
import { MaybeGetter } from '@core/utils/maybeGetter/index';
import { ComputedTokenResolver } from '@graph/computed-tokens/index';
import { CoreEdge, CoreNode } from '@graph/primitives/types';

export type RenderFunctionOptions = {
  shapes: AnimatedShapeFactories;
  resolveToken: ComputedTokenResolver;
};

// ----- NODE RENDERER -----

export type NodeRenderProps = CoreNode & {
  position: Coordinate;
};

export type NodeRenderFunction = (node: NodeRenderProps) => Shape;

export type CreateNodeRenderFunction = (
  options: RenderFunctionOptions,
) => NodeRenderFunction;

// ----- EDGE RENDERER -----

export type EdgeRenderProps = {
  id: string;
  source: NodeRenderProps;
  target: NodeRenderProps;
};

export type EdgeRenderFunction = (edge: EdgeRenderProps) => Shape;

/**
 * tunable spacing values, all optional. separate from the rest of the render options because
 * these are the only ones a caller adjusts to taste rather than to describe its graph.
 */
export type EdgeLayoutOptions = {
  /**
   * pixels of whitespace between two adjacent edges of a fan
   * @default 12
   */
  parallelEdgeSpacing?: number;
  /** @default true */
  labelled?: MaybeGetter<boolean, [edge: EdgeRenderProps]>;
};

export type EdgeRenderOptions = RenderFunctionOptions & {
  directed: boolean;
  labelTextInputColor: (edge: EdgeRenderProps) => string;
  /** every edge running between {@link source} and {@link target} in either direction, including this one, fanned apart by {@link EdgeLayoutOptions.parallelEdgeSpacing} */
  parallelEdges: (edge: EdgeRenderProps) => readonly CoreEdge[];
  /** positions of the nodes adjacent to {@link source} and {@link target}, used to aim self directed edges away from them */
  neighborPositions: (edge: EdgeRenderProps) => readonly Coordinate[];
  layout?: EdgeLayoutOptions;
};

export type CreateEdgeRenderFunction = (
  options: EdgeRenderOptions,
) => EdgeRenderFunction;

/**
 * the two options a caller must answer itself, since they are the only ones that depend on
 * which nodes and edges the renderer should treat as part of the graph.
 */
export type EdgeTopologyOptions = Pick<
  EdgeRenderOptions,
  'parallelEdges' | 'neighborPositions'
>;

/** every edge render option a graph answers the same way regardless of topology */
export type DefaultEdgeRenderOptions = Omit<
  EdgeRenderOptions,
  keyof EdgeTopologyOptions | 'layout'
>;

/** the graph state {@link DefaultEdgeRenderOptions} is derived from */
export type EdgeRenderOptionsSource = {
  surface: {
    shapes: AnimatedShapeFactories;
    theme: { _resolveToken: (token: 'canvas.color') => Color };
  };
  metadata: {
    directed: boolean;
    weighted: boolean;
  };
  resolveToken: ComputedTokenResolver;
};

// ----- BOTH -----

/** the pair of render functions a graph draws all of its nodes and edges with */
export type RenderFunctions = {
  node: NodeRenderFunction;
  edge: EdgeRenderFunction;
};
