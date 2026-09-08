import { OnboardingGraph } from '@magic/shared/graph-shell';
import Fraction from 'fraction.js';

export const onboardingGraph: OnboardingGraph = {
  nodes: [
    { id: 'a', label: 'A', position: { x: -200, y: -120 } },
    { id: 'b', label: 'B', position: { x: 0, y: -170 } },
    { id: 'c', label: 'C', position: { x: 200, y: -120 } },
    { id: 'd', label: 'D', position: { x: -120, y: 140 } },
    { id: 'e', label: 'E', position: { x: 120, y: 140 } },
  ],
  edges: [
    { source: 'a', target: 'd', weight: new Fraction(1) },
    { source: 'a', target: 'b', weight: new Fraction(1) },
    { source: 'b', target: 'd', weight: new Fraction(1) },
    { source: 'b', target: 'c', weight: new Fraction(3) },
    { source: 'c', target: 'e', weight: new Fraction(4) },
    { source: 'b', target: 'e', weight: new Fraction(5) },
    { source: 'd', target: 'e', weight: new Fraction(6) },
  ],
};
