import { getLargestAngularSpaceBisector } from '@canvas/primitives/helpers';
import { LineSchema } from '@canvas/primitives/shapes/line/types';
import { TextArea } from '@canvas/primitives/text/types';
import { WithId } from '@canvas/primitives/types/index';
import { GOLDEN_RATIO } from '@core/utils/math';
import { getValue } from '@core/utils/maybeGetter/index';

import {
  createEdgeStyleResolver,
  createNodeStyleResolver,
} from './resolvers.ts';
import {
  CreateEdgeRenderFunction,
  DefaultEdgeRenderOptions,
  EdgeRenderOptionsSource,
} from './types.ts';
import { getParallelEdgeSlot } from './utils/getParallelEdgeSlot.ts';

const WHITESPACE_BETWEEN_ARROW_TIP_AND_NODE_PX = 2;

const DEFAULT_PARALLEL_EDGE_SPACING_PX = 12;

/**
 * the single definition of how a graph answers every edge render option that does not depend
 * on topology. spread it and supply {@link EdgeTopologyOptions} to build a renderer that
 * differs from the default only where it means to.
 */
export const createDefaultEdgeRenderOptions = (
  source: EdgeRenderOptionsSource,
): DefaultEdgeRenderOptions => ({
  shapes: source.surface.shapes,
  resolveToken: source.resolveToken,
  directed: source.metadata.directed,
  labelTextInputColor: () => source.surface.theme._resolveToken('canvas.color'),
});

export const createEdgeRenderFunction: CreateEdgeRenderFunction = ({
  resolveToken,
  shapes,
  directed,
  labelTextInputColor,
  parallelEdges,
  neighborPositions,
  layout,
}) => {
  const { parallelEdgeSpacing = DEFAULT_PARALLEL_EDGE_SPACING_PX } =
    layout ?? {};

  const resolveEdgeStyles = createEdgeStyleResolver(resolveToken);
  const resolveNodeStyles = createNodeStyleResolver(resolveToken);
  return (edge) => {
    const styles = resolveEdgeStyles({
      id: edge.id,
      source: edge.source.id,
      target: edge.target.id,
    });

    const sourceNode = {
      ...edge.source,
      styles: resolveNodeStyles(edge.source),
    };
    const targetNode = {
      ...edge.target,
      styles: resolveNodeStyles(edge.target),
    };

    const angle = Math.atan2(
      targetNode.position.y - sourceNode.position.y,
      targetNode.position.x - sourceNode.position.x,
    );

    const arrowHeadSpacingAwayFromNode =
      targetNode.styles.border.width / 2 +
      WHITESPACE_BETWEEN_ARROW_TIP_AND_NODE_PX;

    const arrowDrawOffset = {
      x:
        (targetNode.styles.size + arrowHeadSpacingAwayFromNode) *
        Math.cos(angle),
      y:
        (targetNode.styles.size + arrowHeadSpacingAwayFromNode) *
        Math.sin(angle),
    };

    // copied because the shift below would otherwise write through to the position store
    const edgeStart = {
      x: sourceNode.position.x,
      y: sourceNode.position.y,
    };

    const edgeEnd = {
      x: targetNode.position.x - (directed ? arrowDrawOffset.x : 0),
      y: targetNode.position.y - (directed ? arrowDrawOffset.y : 0),
    };

    const slot = getParallelEdgeSlot(edge.id, parallelEdges(edge));

    // both directions of a path must call the same side left, or a reversed edge mirrors onto its twin
    const runsWithPath = edge.source.id <= edge.target.id;
    const perpendicular = angle + (runsWithPath ? Math.PI / 2 : -Math.PI / 2);
    const parallelEdgeOffset = slot * (styles.width + parallelEdgeSpacing);

    edgeStart.x += Math.cos(perpendicular) * parallelEdgeOffset;
    edgeStart.y += Math.sin(perpendicular) * parallelEdgeOffset;
    edgeEnd.x += Math.cos(perpendicular) * parallelEdgeOffset;
    edgeEnd.y += Math.sin(perpendicular) * parallelEdgeOffset;

    const labelled = layout?.labelled ?? true;
    const textArea: TextArea | undefined = getValue(labelled, edge)
      ? {
          color: 'none',
          activeColor: labelTextInputColor(edge),
          textBlock: styles.text,
        }
      : undefined;

    const isSelfDirected = targetNode.id === sourceNode.id;

    const sourceNodeGirth =
      sourceNode.styles.size + sourceNode.styles.border.width / 2;

    if (isSelfDirected) {
      const upDistance =
        (sourceNode.styles.size + sourceNode.styles.border.width) *
        GOLDEN_RATIO;
      const downDistance =
        upDistance - sourceNodeGirth - WHITESPACE_BETWEEN_ARROW_TIP_AND_NODE_PX;

      return shapes.uturn({
        id: edge.id,
        spacing: styles.width * 1.2,
        at: sourceNode.position,
        upDistance,
        downDistance,
        // point the loop into whichever gap between neighbors is widest
        rotation: getLargestAngularSpaceBisector(
          edgeStart,
          neighborPositions(edge),
        ),
        lineWidth: styles.width,
        fillColor: styles.color,
        textArea,
      });
    }

    const lineOptions: WithId<LineSchema> = {
      id: edge.id,
      start: edgeStart,
      end: edgeEnd,
      lineWidth: styles.width,
      fillColor: styles.color,
      textArea,
    };

    if (directed) {
      return shapes.arrow({
        textOffsetFromCenter:
          sourceNodeGirth / 2 + WHITESPACE_BETWEEN_ARROW_TIP_AND_NODE_PX / 2,
        ...lineOptions,
      });
    }

    return shapes.line(lineOptions);
  };
};
