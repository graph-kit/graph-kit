import type { MathJsonExpression } from '@cortex-js/compute-engine';

import { LATEX_SET_SYMBOLS } from '../constants.ts';
import type { Section, SetDefinitionId, SetLabel } from '../types.ts';

/**
 * resolves a set notation MathJSON expression to the sections of the partition it selects,
 * or null when the expression cannot be resolved against that partition
 */
export type ParseSetExpression = (
  mathJSON: MathJsonExpression,
) => SetDefinitionId[][] | null;

/**
 * builds a parser over a partition, where a section lists the SetDefinitionIds covering
 * that region. mathJSON leaves may still be display labels (a raw typed query) or already
 * SetDefinitionIds (an expression built internally, e.g. by the simplifier) - resolveLabel
 * only gets called for the former, so callers already in ID space can pass the identity fn
 */
export const createSetExpressionParser = (
  partition: Section[],
  resolveLabel: (label: SetLabel) => SetDefinitionId,
): ParseSetExpression => {
  const getSet = (label: SetLabel) => {
    if (label === LATEX_SET_SYMBOLS.OMEGA) return partition;
    const identity = resolveLabel(label);
    return partition.filter((section) => section.includes(identity));
  };

  const isEqual = (set1: Section, set2: Section) => {
    return (
      set1.length === set2.length &&
      set1.every((element) => set2.includes(element))
    );
  };

  const union = (set1: Section[], set2: Section[]) => set1.concat(set2);

  const intersection = (set1: Section[], set2: Section[]) =>
    set1.filter((element) => set2.some((other) => isEqual(element, other)));

  const exclusion = (set1: Section[], set2: Section[]) =>
    set1.filter((element) => !set2.some((other) => isEqual(element, other)));

  const difference = (set1: Section[], set2: Section[]) =>
    exclusion(union(set1, set2), intersection(set1, set2));

  const negation = (set: Section[]) =>
    partition.filter((section) =>
      set.every((element) => !isEqual(section, element)),
    );

  const dedupe = (sets: Section[]) =>
    sets.filter(
      (set, index) => sets.findIndex((other) => isEqual(set, other)) === index,
    );

  const parseHelper = (node: MathJsonExpression): Section[] => {
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
      case LATEX_SET_SYMBOLS.NEGATION:
        return negation(parseHelper(args[0]));
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
