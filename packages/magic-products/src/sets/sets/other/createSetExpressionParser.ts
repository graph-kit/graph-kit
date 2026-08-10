import type { MathJsonExpression } from '@cortex-js/compute-engine';

import type { SetLabel } from '../../types.ts';
import { LATEX_SET_SYMBOLS } from './constants.ts';

/**
 * resolves a set notation MathJSON expression to the sections of the partition it selects,
 * or null when the expression cannot be resolved against that partition
 */
export type ParseSetExpression<SetIdentity> = (
  mathJSON: MathJsonExpression,
) => SetIdentity[][] | null;

// TODO remove generic and parse sets with set IDs instead
/**
 * builds a parser over a partition, where a section lists the sets covering that region.
 * the real set space identifies those sets by SetDefinitionId while the simplifier
 * identifies them by label, so resolving a label is left to the caller
 */
export const createSetExpressionParser = <SetIdentity>(
  partition: SetIdentity[][],
  resolveLabel: (label: SetLabel) => SetIdentity | undefined,
): ParseSetExpression<SetIdentity> => {
  const getSet = (label: SetLabel) => {
    if (label === LATEX_SET_SYMBOLS.OMEGA) return partition;

    const identity = resolveLabel(label);
    if (identity === undefined) return [];

    return partition.filter((section) => section.includes(identity));
  };

  const isEqual = (set1: SetIdentity[], set2: SetIdentity[]) => {
    return (
      set1.length === set2.length &&
      set1.every((element) => set2.includes(element))
    );
  };

  const union = (set1: SetIdentity[][], set2: SetIdentity[][]) =>
    set1.concat(set2);

  const intersection = (set1: SetIdentity[][], set2: SetIdentity[][]) =>
    set1.filter((element) => set2.includes(element));

  const exclusion = (set1: SetIdentity[][], set2: SetIdentity[][]) =>
    set1.filter((element) => !set2.includes(element));

  const difference = (set1: SetIdentity[][], set2: SetIdentity[][]) =>
    exclusion(union(set1, set2), intersection(set1, set2));

  const complement = (set: SetIdentity[][]) =>
    partition.filter((section) =>
      set.every((element) => !isEqual(section, element)),
    );

  const dedupe = (sets: SetIdentity[][]) =>
    sets.filter(
      (set, index) => sets.findIndex((other) => isEqual(set, other)) === index,
    );

  const parseHelper = (node: MathJsonExpression): SetIdentity[][] => {
    if (typeof node === 'string') {
      return getSet(node);
    }

    if (
      !Array.isArray(node) ||
      node.length < 2 ||
      typeof node[0] !== 'string'
    ) {
      throw new Error('Invalid MathJSON expression');
    }

    const [head, ...args] = node as [string, ...MathJsonExpression[]];

    switch (head) {
      // the compute engine flattens union/intersection of 3+ sets into one n-ary node,
      // so every arg must fold in, not just the first two
      case LATEX_SET_SYMBOLS.UNION:
        return args.map(parseHelper).reduce(union);
      case LATEX_SET_SYMBOLS.INTERSECTION:
        return args.map(parseHelper).reduce(intersection);
      case LATEX_SET_SYMBOLS.SYMMETRIC_DIFFERENCE:
        return difference(parseHelper(args[0]), parseHelper(args[1]));
      case LATEX_SET_SYMBOLS.COMPLEMENT:
        return complement(parseHelper(args[0]));
      case LATEX_SET_SYMBOLS.SET_MINUS:
        return exclusion(parseHelper(args[0]), parseHelper(args[1]));
      default:
        throw new Error(`Unknown operator: ${head}`);
    }
  };

  return (mathJSON) => {
    if (!mathJSON) return null;
    try {
      return dedupe(parseHelper(mathJSON));
    } catch {
      return null;
    }
  };
};
