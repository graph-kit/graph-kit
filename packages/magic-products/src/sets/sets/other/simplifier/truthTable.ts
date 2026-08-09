import type { MathJsonExpression } from '@cortex-js/compute-engine';

import { OUTSIDE_ALL_SETS, RESERVED_LABELS } from '../constants.ts';
import { createSetExpressionParser } from '../createSetExpressionParser.ts';

const RESERVED = new Set<string>(RESERVED_LABELS);

export const extractVariables = (node: MathJsonExpression): string[] => {
  if (typeof node === 'string') {
    return /^[A-Z]$/.test(node) && !RESERVED.has(node) ? [node] : [];
  }

  if (!Array.isArray(node)) return [];

  return [...new Set(node.slice(1).flatMap(extractVariables))].sort();
};

// minterm i represents the atom where variable[j] is present iff bit j of i is set.
// this partition is symbolic, so minterm 0 (no variables) uses the label the parser
// resolves rather than an identity that only the real set space has.
const buildPartition = (variables: string[]): string[][] =>
  Array.from({ length: 2 ** variables.length }, (_, i) => {
    const atom = variables.filter((_, j) => (i >> j) & 1);
    return atom.length === 0 ? [OUTSIDE_ALL_SETS.display] : atom;
  });

export const getTruthTable = (
  node: MathJsonExpression,
  variables: string[],
): number => {
  const partition = buildPartition(variables);
  // this partition is symbolic, so a label already is how a set is identified in it
  const parse = createSetExpressionParser(partition, (label) => label);
  const result = parse(node);

  if (!result) return 0;

  return partition.reduce((mask, atom, i) => {
    const inResult = result.some(
      (r) => r.length === atom.length && r.every((v) => atom.includes(v)),
    );

    return inResult ? mask | (1 << i) : mask;
  }, 0);
};

export const getOneMinterms = (
  truthTable: number,
  variableCount: number,
): number[] =>
  Array.from({ length: 2 ** variableCount }, (_, i) => i).filter(
    (i) => (truthTable >> i) & 1,
  );
