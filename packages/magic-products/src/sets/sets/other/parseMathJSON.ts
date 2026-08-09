import { ComputeEngine } from '@cortex-js/compute-engine';

import { ALPHABET } from './constants.ts';
import { LATEX_SET_SYMBOLS } from './constants.ts';

const engine = new ComputeEngine();

// make sure that all upper case chars and Omega are treated as sets in the compute engine
// otherwise might not interpret correctly and throw error even for correct syntax
for (const letter of ALPHABET) {
  engine.declare(letter, 'set');
}
engine.declare(LATEX_SET_SYMBOLS.OMEGA, 'set');

export const parseMathJSON = (latex: string) => engine.parse(latex);
