import { OnboardingGraph } from '@magic/shared/graph-shell';
import Fraction from 'fraction.js';

/** https://www.geeksforgeeks.org/nlp/markov-chains-in-nlp/ */
export const onboardingGraph: OnboardingGraph = {
  nodes: [
    { id: 'rainy', label: 'A', position: { x: -220, y: -140 } },
    { id: 'cloudy', label: 'B', position: { x: 220, y: -140 } },
    { id: 'sunny', label: 'C', position: { x: 0, y: 160 } },
  ],
  edges: [
    { source: 'rainy', target: 'rainy', weight: new Fraction(1, 2) },
    { source: 'rainy', target: 'cloudy', weight: new Fraction(3, 10) },
    { source: 'rainy', target: 'sunny', weight: new Fraction(1, 5) },

    { source: 'cloudy', target: 'cloudy', weight: new Fraction(2, 5) },
    { source: 'cloudy', target: 'rainy', weight: new Fraction(1, 5) },
    { source: 'cloudy', target: 'sunny', weight: new Fraction(2, 5) },

    { source: 'sunny', target: 'sunny', weight: new Fraction(4, 5) },
    { source: 'sunny', target: 'rainy', weight: new Fraction(1, 10) },
    { source: 'sunny', target: 'cloudy', weight: new Fraction(1, 10) },
  ],
};
