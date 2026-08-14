import { nullThrows } from '@core/utils/assert';
import { MaybeGetter, getValue } from '@core/utils/maybeGetter/index';

import { MagicGraph } from '../graph-product/types.ts';
import { parseTextSegments } from './parseTextSegments.ts';
import { Explainer, ExplainerHighlight } from './types.ts';
import { useGraphElementRefExplainerSegment } from './useGraphElementIdPart.ts';

export type ExplainerSegment = {
  id: string;
  text: MaybeGetter<string>;
  highlight: ExplainerHighlight | undefined;
};

export const explainerSegments = (
  graph: MagicGraph,
  explainer: Explainer | undefined,
): ExplainerSegment[] => {
  if (!explainer) return [];

  const textValue = getValue(explainer.content, graph);
  const highlightsValue = getValue(explainer.highlights, graph) ?? [];

  const textSegments = parseTextSegments(textValue);

  const explainerSegments: ExplainerSegment[] = [];

  let highlightIndex = 0;
  for (const { bracketType, text } of textSegments) {
    const segmentId = crypto.randomUUID();
    if (bracketType === undefined) {
      explainerSegments.push({
        id: segmentId,
        highlight: undefined,
        text,
      });
      continue;
    }
    if (bracketType === 'curly') {
      explainerSegments.push(useGraphElementRefExplainerSegment(graph, text));
      continue;
    }
    const highlight = nullThrows(
      highlightsValue.at(highlightIndex++),
      `explainer content has more [bracketed] segments than highlights (expected highlights[${highlightIndex}])`,
    );
    explainerSegments.push({
      id: segmentId,
      highlight,
      text,
    });
  }

  return explainerSegments;
};
