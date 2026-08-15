import type { MathJsonExpression } from '@cortex-js/compute-engine';

import type { SetDefinitionId, SetLabel } from '../../../types.ts';
import {
  LATEX_SET_SYMBOLS,
  OUTSIDE_ALL_SETS,
  RESERVED_LABELS,
} from '../constants.ts';
import { parseMathJSON } from '../parseMathJSON.ts';
import { dnfToMathJson, mathJsonToLatex } from './dnf.ts';
import { minimizeDNF } from './quine-mccluskey.ts';
import {
  extractVariables,
  getOneMinterms,
  getTruthTable,
} from './truthTable.ts';

const MAX_VARIABLES = 8;
const MAX_SIMPLIFICATION_ITERATIONS = 10;
const RESERVED = new Set<string>(RESERVED_LABELS);
const OPERATOR_WEIGHTS = {
  '\\cup': 1,
  '\\cap': 1,
  '\\neg': 1,
  // both spellings of the complement postfix, which is a negation written the other way
  '^{\\complement}': 1,
  '^\\complement': 1,
  '\\setminus': 2,
  '\\triangle': 3,
} as const;

const stripWhitespace = (s: string) => s.replace(/\s/g, '');

const stripDoubleNegation = (node: MathJsonExpression): MathJsonExpression => {
  if (!Array.isArray(node)) return node;

  const [head, ...args] = node;

  if (
    head === LATEX_SET_SYMBOLS.NEGATION &&
    Array.isArray(args[0]) &&
    args[0][0] === LATEX_SET_SYMBOLS.NEGATION
  ) {
    return stripDoubleNegation(args[0][1] as MathJsonExpression);
  }

  return [head, ...args.map(stripDoubleNegation)] as MathJsonExpression;
};

// walks leaves only, so Omega and operator heads pass through untouched
const mapLeaves = (
  node: MathJsonExpression,
  resolve: (leaf: string) => string,
): MathJsonExpression => {
  if (typeof node === 'string') {
    return node === LATEX_SET_SYMBOLS.OMEGA ? node : resolve(node);
  }

  if (!Array.isArray(node)) return node;

  const [head, ...args] = node;
  return [
    head,
    ...args.map((arg) => mapLeaves(arg, resolve)),
  ] as MathJsonExpression;
};

const countOperatorWeight = (latex: string): number => {
  const strippedLatex = stripWhitespace(latex);
  return Object.entries(OPERATOR_WEIGHTS).reduce(
    (total, [operator, weight]) =>
      total + (strippedLatex.split(operator).length - 1) * weight,
    0,
  );
};

const trySimplify = (
  node: MathJsonExpression,
  variables: SetDefinitionId[],
  originalLatex: string,
  outsideId: SetDefinitionId,
  toLabel: (id: SetDefinitionId) => SetLabel,
): string | null => {
  const truthTable = getTruthTable(node, variables, outsideId);
  const oneMinterms = getOneMinterms(truthTable, variables.length);

  // a full cover is the universal set, which minimizes to a term of no literals for DNF to write
  if (oneMinterms.length === 2 ** variables.length) {
    const universalSet = mathJsonToLatex(LATEX_SET_SYMBOLS.OMEGA);
    return stripWhitespace(originalLatex) === universalSet
      ? null
      : universalSet;
  }

  // an empty cover is the empty set, which a query writes as nothing at all
  if (oneMinterms.length === 0) {
    return stripWhitespace(originalLatex) === '' ? null : '';
  }

  const terms = minimizeDNF(oneMinterms, variables);
  const simplified = dnfToMathJson(terms);

  if (getTruthTable(simplified, variables, outsideId) !== truthTable)
    return null;

  const result = mathJsonToLatex(mapLeaves(simplified, toLabel));
  if (stripWhitespace(result) === stripWhitespace(originalLatex)) return null;

  return result;
};

const simplifyOnce = (
  latex: string,
  definedLabels: SetLabel[] | undefined,
  resolveId: (label: SetLabel) => SetDefinitionId,
  toLabel: (id: SetDefinitionId) => SetLabel,
): string | null => {
  const expression = parseMathJSON(latex);
  if (!expression) return null;

  const rawNode = expression.json;

  const canvasVars = definedLabels?.filter((v) => !RESERVED.has(v)).sort();
  const usedLabels =
    canvasVars && canvasVars.length > 0
      ? canvasVars
      : extractVariables(rawNode);

  if (usedLabels.length === 0 || usedLabels.length > MAX_VARIABLES) return null;

  const variables = usedLabels.map(resolveId);
  const node = mapLeaves(rawNode, resolveId);
  const outsideId = resolveId(OUTSIDE_ALL_SETS.label);

  return trySimplify(node, variables, latex, outsideId, toLabel);
};

// only this boundary and simplifyOnce's egress ever touch a display label;
// everything between them is identified by SetDefinitionId, per createSetExpressionParser.ts
export const simplify = (
  latex: string,
  labelToId?: Record<SetLabel, SetDefinitionId>,
): string | null => {
  const definedLabels = labelToId ? Object.keys(labelToId) : undefined;
  // falls back to the label as its own identity when there is no real set space to resolve against
  const resolveId = (label: SetLabel) => labelToId?.[label] ?? label;
  const idToLabel = labelToId
    ? Object.fromEntries(
        Object.entries(labelToId).map(([label, id]) => [id, label]),
      )
    : undefined;
  const toLabel = (id: SetDefinitionId) => idToLabel?.[id] ?? id;

  const expression = parseMathJSON(latex);
  const stripped = expression
    ? mathJsonToLatex(stripDoubleNegation(expression.json))
    : null;
  const baseLatex =
    stripped && stripWhitespace(stripped) !== stripWhitespace(latex)
      ? stripped
      : latex;

  const originalWeight = countOperatorWeight(latex);

  let current = baseLatex;
  let best: string | null = baseLatex !== latex ? baseLatex : null;
  let bestWeight = best !== null ? countOperatorWeight(best) : originalWeight;

  // every check below is against null rather than falsy, since the empty set simplifies to ''
  for (let i = 0; i < MAX_SIMPLIFICATION_ITERATIONS; i++) {
    const next = simplifyOnce(current, definedLabels, resolveId, toLabel);
    if (next === null) break;
    current = next;

    const weight = countOperatorWeight(next);
    if (weight < bestWeight) {
      best = next;
      bestWeight = weight;
    }
  }

  if (best === null || bestWeight >= originalWeight) return null;

  return best;
};
