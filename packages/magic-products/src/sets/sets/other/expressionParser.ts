import type { MathJsonExpression } from '@cortex-js/compute-engine'
import { LATEX_SET_SYMBOLS } from './constants'

type Subset = string[]

const setParser = (partition: Subset[]) => {
  const getSet = (set: string) => {
    if (set === LATEX_SET_SYMBOLS.OMEGA) return partition
    return partition.filter((subset) => subset.includes(set))
  }

  const isEqual = (set1: Subset, set2: Subset) => {
    return set1.length === set2.length && set1.every((element) => set2.includes(element))
  }

  const union = (set1: Subset[], set2: Subset[]) => set1.concat(set2)

  const intersection = (set1: Subset[], set2: Subset[]) =>
    set1.filter((element) => set2.includes(element))

  const exclusion = (set1: Subset[], set2: Subset[]) =>
    set1.filter((element) => !set2.includes(element))

  const difference = (set1: Subset[], set2: Subset[]) =>
    exclusion(union(set1, set2), intersection(set1, set2))

  const complement = (set: Subset[]) =>
    partition.filter((subset) => set.every((element) => !isEqual(subset, element)))

  const dedupe = (sets: Subset[]) =>
    sets.filter((set, index) => sets.findIndex((other) => isEqual(set, other)) === index)

  const parseHelper = (node: MathJsonExpression): Subset[] => {
    if (typeof node === 'string') {
      return getSet(node)
    }

    if (!Array.isArray(node) || node.length < 2 || typeof node[0] !== 'string') {
      throw new Error('Invalid MathJSON expression')
    }

    const [head, ...args] = node as [string, ...MathJsonExpression[]]

    switch (head) {
      case LATEX_SET_SYMBOLS.UNION:
        return union(parseHelper(args[0]), parseHelper(args[1]))
      case LATEX_SET_SYMBOLS.INTERSECTION:
        return intersection(parseHelper(args[0]), parseHelper(args[1]))
      case LATEX_SET_SYMBOLS.SYMMETRIC_DIFFERENCE:
        return difference(parseHelper(args[0]), parseHelper(args[1]))
      case LATEX_SET_SYMBOLS.COMPLEMENT:
        return complement(parseHelper(args[0]))
      case LATEX_SET_SYMBOLS.SET_MINUS:
        return exclusion(parseHelper(args[0]), parseHelper(args[1]))
      default:
        throw new Error(`Unknown operator: ${head}`)
    }
  }

  return (mathJSON: MathJsonExpression): Subset[] | null => {
    if (!mathJSON) return null
    try {
      return dedupe(parseHelper(mathJSON))
    } catch {
      return null
    }
  }
}

export { setParser }
