import type { MathJsonExpression } from '@cortex-js/compute-engine';

import { LATEX_SET_SYMBOLS } from '../constants.ts';
import type { DNFTerm } from './quine-mccluskey.ts';

const negation = (arg: MathJsonExpression): MathJsonExpression => [
  LATEX_SET_SYMBOLS.NEGATION,
  arg,
];

const difference = (
  a: MathJsonExpression,
  b: MathJsonExpression,
): MathJsonExpression => [LATEX_SET_SYMBOLS.SET_MINUS, a, b];

const symmetricDifference = (
  a: MathJsonExpression,
  b: MathJsonExpression,
): MathJsonExpression => [LATEX_SET_SYMBOLS.SYMMETRIC_DIFFERENCE, a, b];

const setsEqual = (a: Set<string>, b: Set<string>): boolean => {
  if (a.size !== b.size) return false;
  return [...a].every((x) => b.has(x));
};

const foldBinary = (
  op: string,
  items: MathJsonExpression[],
): MathJsonExpression => {
  if (items.length === 1) return items[0];
  return [op, items[0], foldBinary(op, items.slice(1))];
};

// (A ∩ ¬B) ∪ (¬A ∩ B) → A △ B
const matchSymmetricDiff = (terms: DNFTerm[]): MathJsonExpression | null => {
  if (terms.length !== 2) return null;

  const [t1, t2] = terms;

  if (t1.positive.size !== 1 || t1.negative.size !== 1) return null;

  if (
    setsEqual(t1.positive, t2.negative) &&
    setsEqual(t1.negative, t2.positive)
  ) {
    const [a] = t1.positive;
    const [b] = t1.negative;

    return symmetricDifference(a, b);
  }

  return null;
};

// (A ∩ B) ∪ (¬A ∩ ¬B) → ¬(A △ B)
const matchNegatedSymmetricDiff = (
  terms: DNFTerm[],
): MathJsonExpression | null => {
  if (terms.length !== 2) return null;

  const [t1, t2] = terms;

  const allPos = (t: DNFTerm) => t.negative.size === 0 && t.positive.size === 2;

  const allNeg = (t: DNFTerm) => t.positive.size === 0 && t.negative.size === 2;

  if (!((allPos(t1) && allNeg(t2)) || (allNeg(t1) && allPos(t2)))) {
    return null;
  }

  const posTerm = allPos(t1) ? t1 : t2;
  const negTerm = allNeg(t1) ? t1 : t2;

  if (!setsEqual(posTerm.positive, negTerm.negative)) return null;

  const [a, b] = [...posTerm.positive];

  return negation(symmetricDifference(a, b));
};

const termToMathJson = (term: DNFTerm): MathJsonExpression => {
  const { positive, negative } = term;

  // A \ B
  if (positive.size === 1 && negative.size === 1) {
    const [a] = positive;
    const [b] = negative;

    return difference(a, b);
  }

  // ¬(A ∪ B ∪ ...)
  if (positive.size === 0 && negative.size > 0) {
    return negation(foldBinary(LATEX_SET_SYMBOLS.UNION, [...negative]));
  }

  // General intersection of literals
  const literals: MathJsonExpression[] = [
    ...positive,
    ...[...negative].map((v) => negation(v)),
  ];

  return foldBinary(LATEX_SET_SYMBOLS.INTERSECTION, literals);
};

export const dnfToMathJson = (terms: DNFTerm[]): MathJsonExpression => {
  const symDiff = matchSymmetricDiff(terms);
  if (symDiff) return symDiff;

  const negatedSymDiff = matchNegatedSymmetricDiff(terms);
  if (negatedSymDiff) return negatedSymDiff;

  return foldBinary(LATEX_SET_SYMBOLS.UNION, terms.map(termToMathJson));
};

type FunctionExpression = [string, ...MathJsonExpression[]];

const isFunctionExpression = (
  expr: MathJsonExpression,
): expr is FunctionExpression =>
  Array.isArray(expr) && expr.length > 0 && typeof expr[0] === 'string';

export const mathJsonToLatex = (node: MathJsonExpression): string => {
  // a set label is its own latex, but the universal set is a symbol name standing in for one
  if (typeof node === 'string')
    return node === LATEX_SET_SYMBOLS.OMEGA ? '\\Omega' : node;
  if (!Array.isArray(node)) return '';

  if (!isFunctionExpression(node)) return '';

  const [head, ...args] = node;

  const ASSOCIATIVE = [LATEX_SET_SYMBOLS.UNION, LATEX_SET_SYMBOLS.INTERSECTION];

  const wrap = (child: MathJsonExpression): string => {
    if (typeof child === 'string') return mathJsonToLatex(child);
    if (!Array.isArray(child)) return '';

    if (!isFunctionExpression(child)) return '';
    const childHead = child[0];

    // Same associative operator — A ∪ (B ∪ C) → A ∪ B ∪ C
    if (
      childHead === head &&
      ASSOCIATIVE.includes(head as 'Union' | 'Intersection')
    ) {
      return mathJsonToLatex(child);
    }

    const inner = mathJsonToLatex(child);

    // negation binds tighter than every operator it can sit under, so it never needs parenthesizing
    return childHead !== LATEX_SET_SYMBOLS.NEGATION
      ? `\\left(${inner}\\right)`
      : inner;
  };

  switch (head) {
    // the compute engine flattens union/intersection of 3+ sets into one n-ary node,
    // so every arg must fold in, not just the first two - see createSetExpressionParser.ts
    case LATEX_SET_SYMBOLS.UNION:
      return args.map(wrap).join(' \\cup ');

    case LATEX_SET_SYMBOLS.INTERSECTION:
      return args.map(wrap).join(' \\cap ');

    case LATEX_SET_SYMBOLS.SET_MINUS:
      return `${wrap(args[0])} \\setminus ${wrap(args[1])}`;

    case LATEX_SET_SYMBOLS.SYMMETRIC_DIFFERENCE:
      return `${wrap(args[0])} \\triangle ${wrap(args[1])}`;

    case LATEX_SET_SYMBOLS.NEGATION:
      return `\\neg ${wrap(args[0])}`;

    default:
      return String(node);
  }
};
