import { GNode } from '@magic/shared/graph';
import Fraction from 'fraction.js';

/** the chance of sitting in each state after the playhead position's worth of transitions */
export type DistributionFrame = Map<GNode['id'], Fraction>;
