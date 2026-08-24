import { Explainer, ExplainerHighlight } from '@magic/shared/explainer';

import { explainerDistance } from '../distance.ts';
import { matrixSlotId } from './effects.ts';
import { AllPairsFrame } from './frame.ts';

const matrixHighlight = (tooltipLabel: string): ExplainerHighlight => ({
  tooltipLabel,
  activate: ({ shell }) => shell.componentSlots.setHighlighted(matrixSlotId),
  deactivate: ({ shell }) => shell.componentSlots.clearHighlighted(),
});

const highlights = {
  table: matrixHighlight(
    'The cheapest trip we know between every pair of nodes',
  ),
  improve: matrixHighlight('The detour is cheaper, so the cell gets rewritten'),
} as const satisfies Record<string, ExplainerHighlight>;

export const allPairsExplainer =
  () =>
  (frame: AllPairsFrame): Explainer | undefined => {
    if (frame.type === 'start') {
      return {
        content: 'Seeding the [Table] with the Edges We Already Have',
        highlights: [highlights.table],
      };
    }

    if (frame.type === 'end') {
      return {
        content: "Done! Every Pair's Shortest Trip Is in the [Table]",
        highlights: [highlights.table],
      };
    }

    if (frame.type === 'choose-pivot') {
      return {
        content: `Pivot ${frame.pivotNumber} of ${frame.totalPivots}: Can Detouring Through {${frame.node}} Beat the [Table]?`,
        highlights: [highlights.table],
      };
    }

    if (frame.type === 'consider-pair') {
      return {
        content: `{${frame.from}} to {${frame.to}} via {${frame.pivot}} Costs ${explainerDistance(frame.viaPivot)}, Against ${explainerDistance(frame.direct)} Today`,
      };
    }

    if (frame.type === 'improve-pair') {
      return {
        content: `The Detour Wins, So [Updating] {${frame.from}} to {${frame.to}} to ${explainerDistance(frame.newDistance)}`,
        highlights: [highlights.improve],
      };
    }

    if (frame.type === 'keep-pair') {
      return {
        content: `{${frame.from}} to {${frame.to}} Is Already ${explainerDistance(frame.distance)}, So the Detour Through {${frame.pivot}} Is No Help`,
      };
    }

    if (frame.type === 'negative-cycle') {
      return {
        content: `{${frame.node}} Can Still Get Cheaper! A Negative Cycle Means No Shortest Path Exists`,
      };
    }
  };
