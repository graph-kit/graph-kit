import type { MathJsonExpression } from '@cortex-js/compute-engine'
import { setParser } from '../expressionParser.ts'
import { RESERVED_LABELS } from '../constants.ts'

const RESERVED = new Set<string>(RESERVED_LABELS)

export const extractVariables = (node: MathJsonExpression): string[] => {
  if (typeof node === 'string') {
    return /^[A-Z]$/.test(node) && !RESERVED.has(node) ? [node] : []
  }

  if (!Array.isArray(node)) return []

  return [...new Set(node.slice(1).flatMap(extractVariables))].sort()
}

// minterm i represents the atom where variable[j] is present iff bit j of i is set.
// minterm 0 (no variables) is the complement region, represented as ['S'] so that
// getSet('S') in the expression parser resolves it correctly.
const buildPartition = (variables: string[]): string[][] =>
  Array.from({ length: 2 ** variables.length }, (_, i) => {
    const atom = variables.filter((_, j) => (i >> j) & 1)
    return atom.length === 0 ? ['S'] : atom
  })

export const getTruthTable = (
  node: MathJsonExpression,
  variables: string[],
): number => {
  const partition = buildPartition(variables)
  const parse = setParser(partition)
  const result = parse(node)

  if (!result) return 0

  return partition.reduce((mask, atom, i) => {
    const inResult = result.some(
      r => r.length === atom.length && r.every(v => atom.includes(v)),
    )

    return inResult ? mask | (1 << i) : mask
  }, 0)
}

export const getOneMinterms = (
  truthTable: number,
  variableCount: number,
): number[] =>
  Array.from({ length: 2 ** variableCount }, (_, i) => i)
    .filter(i => (truthTable >> i) & 1)