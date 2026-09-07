import { OnboardingGraph } from '@magic/shared/graph-shell';

/** a branch and a merge, so the order a traversal settles on is worth watching */
export const onboardingGraph: OnboardingGraph = {
  nodes: [
    { id: 'a', label: 'A', position: { x: 0, y: -160 } },
    { id: 'b', label: 'B', position: { x: -160, y: -20 } },
    { id: 'c', label: 'C', position: { x: 160, y: -20 } },
    { id: 'd', label: 'D', position: { x: -260, y: 140 } },
    { id: 'e', label: 'E', position: { x: -60, y: 140 } },
    { id: 'f', label: 'F', position: { x: 160, y: 140 } },
  ],
  edges: [
    { source: 'a', target: 'b' },
    { source: 'a', target: 'c' },
    { source: 'b', target: 'd' },
    { source: 'b', target: 'e' },
    { source: 'c', target: 'f' },
    { source: 'e', target: 'f' },
  ],
};
