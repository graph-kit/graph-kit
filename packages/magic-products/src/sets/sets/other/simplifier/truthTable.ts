import type { MathJsonExpression } from '@cortex-js/compute-engine';

import type { SetDefinitionId } from '../../../types.ts';
import { RESERVED_LABELS } from '../constants.ts';
import { createSetExpressionParser } from '../createSetExpressionParser.ts';

const RESERVED = new Set<string>(RESERVED_LABELS);

// operates on the raw, unresolved query text, so a label is correct here -
// this is the one place in the simplifier a label is allowed to originate
export const extractVariables = (node: MathJsonExpression): string[] => {
  if (typeof node === 'string') {
    return /^[A-Z]$/.test(node) && !RESERVED.has(node) ? [node] : [];
  }

  if (!Array.isArray(node)) return [];

  return [...new Set(node.slice(1).flatMap(extractVariables))].sort();
};

// minterm i represents the atom where variable[j] is present iff bit j of i is set.
// the caller resolves what identifies "outside all sets" in its own identity space,
// since a symbolic caller and the real set space disagree on what that is
const buildPartition = (
  variables: SetDefinitionId[],
  outsideId: SetDefinitionId,
): SetDefinitionId[][] =>
  Array.from({ length: 2 ** variables.length }, (_, i) => {
    const atom = variables.filter((_, j) => (i >> j) & 1);
    return atom.length === 0 ? [outsideId] : atom;
  });

/** bigint needed to handle >5 set defs in the truth table */
export type TruthTable = bigint;

export const getTruthTable = (
  node: MathJsonExpression,
  variables: SetDefinitionId[],
  outsideId: SetDefinitionId,
): TruthTable => {
  const partition = buildPartition(variables, outsideId);
  // node's leaves are already SetDefinitionIds by the time they reach here
  const parse = createSetExpressionParser(partition, (id) => id);
  const result = parse(node);

  if (!result) return 0n;

  return partition.reduce((mask, atom, i) => {
    const inResult = result.some(
      (r) => r.length === atom.length && r.every((v) => atom.includes(v)),
    );

    return inResult ? mask | (1n << BigInt(i)) : mask;
  }, 0n);
};

export const getOneMinterms = (
  truthTable: TruthTable,
  variableCount: number,
): number[] =>
  Array.from({ length: 2 ** variableCount }, (_, i) => i).filter(
    (i) => (truthTable >> BigInt(i)) & 1n,
  );
