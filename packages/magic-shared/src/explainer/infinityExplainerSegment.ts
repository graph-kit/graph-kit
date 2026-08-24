import { ExplainerSegment } from './explainerSegments.ts';

const infinityTexts = ['∞', String(Infinity)];

export const isExplainerInfinity = (raw: string) =>
  infinityTexts.includes(raw.trim());

/**
 * shows the symbol (∞) for infinity, hovers to reveal the word "Infinity"
 *
 * @example infinityExplainerSegment() // '∞', hovers to reveal 'Infinity'
 */
export const infinityExplainerSegment = (): ExplainerSegment => ({
  id: crypto.randomUUID(),
  text: '∞',
  highlight: {
    tooltipLabel: 'Infinity',
  },
});
