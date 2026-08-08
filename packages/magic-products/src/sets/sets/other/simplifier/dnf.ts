import type { MathJsonExpression } from '@cortex-js/compute-engine'
import type { DNFTerm } from './quine-mccluskey'
import { LATEX_SET_SYMBOLS } from '../constants'

const union = (...args: MathJsonExpression[]): MathJsonExpression =>
  [LATEX_SET_SYMBOLS.UNION, ...args]

const intersection = (...args: MathJsonExpression[]): MathJsonExpression =>
  [LATEX_SET_SYMBOLS.INTERSECTION, ...args]

const complement = (arg: MathJsonExpression): MathJsonExpression =>
  [LATEX_SET_SYMBOLS.COMPLEMENT, arg]

const difference = (
  a: MathJsonExpression,
  b: MathJsonExpression,
): MathJsonExpression =>
  [LATEX_SET_SYMBOLS.SET_MINUS, a, b]

const symmetricDifference = (
  a: MathJsonExpression,
  b: MathJsonExpression,
): MathJsonExpression =>
  [LATEX_SET_SYMBOLS.SYMMETRIC_DIFFERENCE, a, b]

const setsEqual = (a: Set<string>, b: Set<string>): boolean => {
  if (a.size !== b.size) return false
  return [...a].every(x => b.has(x))
}

const foldBinary = (
  op: string,
  items: MathJsonExpression[],
): MathJsonExpression => {
  if (items.length === 1) return items[0]
  return [op, items[0], foldBinary(op, items.slice(1))]
}

// (A ∩ B^c) ∪ (A^c ∩ B) → A △ B
const matchSymmetricDiff = (
  terms: DNFTerm[],
): MathJsonExpression | null => {
  if (terms.length !== 2) return null

  const [t1, t2] = terms

  if (t1.positive.size !== 1 || t1.negative.size !== 1) return null

  if (setsEqual(t1.positive, t2.negative) &&
      setsEqual(t1.negative, t2.positive)) {
    const [a] = t1.positive
    const [b] = t1.negative

    return symmetricDifference(a, b)
  }

  return null
}

// (A ∩ B) ∪ (A^c ∩ B^c) → (A △ B)^c
const matchComplementSymmetricDiff = (
  terms: DNFTerm[],
): MathJsonExpression | null => {
  if (terms.length !== 2) return null

  const [t1, t2] = terms

  const allPos = (t: DNFTerm) =>
    t.negative.size === 0 && t.positive.size === 2

  const allNeg = (t: DNFTerm) =>
    t.positive.size === 0 && t.negative.size === 2

  if (!((allPos(t1) && allNeg(t2)) || (allNeg(t1) && allPos(t2)))) {
    return null
  }

  const posTerm = allPos(t1) ? t1 : t2
  const negTerm = allNeg(t1) ? t1 : t2

  if (!setsEqual(posTerm.positive, negTerm.negative)) return null

  const [a, b] = [...posTerm.positive]

  return complement(symmetricDifference(a, b))
}

const termToMathJson = (term: DNFTerm): MathJsonExpression => {
  const { positive, negative } = term

  // A \ B
  if (positive.size === 1 && negative.size === 1) {
    const [a] = positive
    const [b] = negative

    return difference(a, b)
  }

  // (A ∪ B ∪ ...)^c
  if (positive.size === 0 && negative.size > 0) {
    return complement(foldBinary(LATEX_SET_SYMBOLS.UNION, [...negative]))
  }

  // General intersection of literals
  const literals: MathJsonExpression[] = [
    ...positive,
    ...[...negative].map(
      v => complement(v),
    ),
  ]

  return foldBinary(LATEX_SET_SYMBOLS.INTERSECTION, literals)
}

export const dnfToMathJson = (
  terms: DNFTerm[],
): MathJsonExpression => {
  const symDiff = matchSymmetricDiff(terms)
  if (symDiff) return symDiff

  const compSymDiff = matchComplementSymmetricDiff(terms)
  if (compSymDiff) return compSymDiff

  return foldBinary(LATEX_SET_SYMBOLS.UNION, terms.map(termToMathJson))
}

type FunctionExpression = [string, ...MathJsonExpression[]]

const isFunctionExpression = (
  expr: MathJsonExpression,
): expr is FunctionExpression =>
  Array.isArray(expr) &&
  expr.length > 0 &&
  typeof expr[0] === 'string'

export const mathJsonToLatex = (
  node: MathJsonExpression,
): string => {
  if (typeof node === 'string') return node
  if (!Array.isArray(node)) return ''

  if (!isFunctionExpression(node)) return ''

  const [head, ...args] = node

  const ASSOCIATIVE = [LATEX_SET_SYMBOLS.UNION, LATEX_SET_SYMBOLS.INTERSECTION]

  const wrap = (child: MathJsonExpression): string => {
    if (typeof child === 'string') return child
    if (!Array.isArray(child)) return ''

    if (!isFunctionExpression(child)) return ''
    const childHead = child[0]

    // Same associative operator — A ∪ (B ∪ C) → A ∪ B ∪ C
    if (childHead === head && ASSOCIATIVE.includes(head)) {
      return mathJsonToLatex(child)
    }

    const inner = mathJsonToLatex(child)

    return childHead !== LATEX_SET_SYMBOLS.COMPLEMENT
      ? `\\left(${inner}\\right)`
      : inner
  }

  switch (head) {
    case LATEX_SET_SYMBOLS.UNION:
      return `${wrap(args[0])} \\cup ${wrap(args[1])}`

    case LATEX_SET_SYMBOLS.INTERSECTION:
      return `${wrap(args[0])} \\cap ${wrap(args[1])}`

    case LATEX_SET_SYMBOLS.SET_MINUS:
      return `${wrap(args[0])} \\setminus ${wrap(args[1])}`

    case LATEX_SET_SYMBOLS.SYMMETRIC_DIFFERENCE:
      return `${wrap(args[0])} \\triangle ${wrap(args[1])}`

    case LATEX_SET_SYMBOLS.COMPLEMENT:
      return `${wrap(args[0])}^{\\complement}`

    default:
      return String(node)
  }
}