import { OnboardingGraph } from '@magic/shared/graph-shell';
import Fraction from 'fraction.js';

/** two routes from A to D, where the longer one by edge count is the cheaper one */
export const onboardingGraph: OnboardingGraph = {
  nodes: [
    { id: 'a', label: 'A', position: { x: -240, y: 0 } },
    { id: 'b', label: 'B', position: { x: -40, y: -140 } },
    { id: 'c', label: 'C', position: { x: -40, y: 140 } },
    { id: 'd', label: 'D', position: { x: 200, y: 0 } },
  ],
  edges: [
    { source: 'a', target: 'b', weight: new Fraction(4) },
    { source: 'a', target: 'c', weight: new Fraction(2) },
    { source: 'b', target: 'c', weight: new Fraction(1) },
    { source: 'b', target: 'd', weight: new Fraction(3) },
    { source: 'c', target: 'd', weight: new Fraction(4) },
  ],
};
