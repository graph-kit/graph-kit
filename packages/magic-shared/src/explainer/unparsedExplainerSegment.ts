import { ExplainerSegment } from './explainerSegments.ts';

/**
 * the segment standing in for explainer content that could not be resolved — a
 * red `?` that hovers to reveal what went wrong
 *
 * @param tooltipLabel what the reader sees on hover
 * @example unparsedExplainerSegment('Could Not Parse Fraction "one half"')
 */
export const unparsedExplainerSegment = (
  tooltipLabel: string,
): ExplainerSegment => ({
  id: crypto.randomUUID(),
  text: '?',
  highlight: {
    tooltipLabel,
    classes: [
      'bg-red-500 hover:bg-red-700 active:bg-red-700 text-white',
      'dark:bg-red-500 dark:hover:bg-red-700 dark:active:bg-red-700 dark:text-white',
    ].join(' '),
  },
});
