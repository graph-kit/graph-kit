import { parseMathJSON } from './parseMathJSON.ts';
import { mathJsonToLatex } from './simplifier/dnf.ts';

const BINARY_OPS = ['\\cup', '\\cap', '\\setminus', '\\triangle'] as const;

type BinaryOp = (typeof BINARY_OPS)[number];

const TOKEN_REGEX =
  /\\left\(|\\right\)|\(|\)|\\cup|\\cap|\\setminus|\\triangle/g;

const isSegmentAmbiguous = (ops: BinaryOp[]): boolean => {
  const distinct = new Set(ops);
  if (distinct.size > 1) return true;
  return distinct.has('\\setminus') && ops.length >= 2;
};

export const isAmbiguous = (latex: string): boolean => {
  const tokens = latex.match(TOKEN_REGEX) ?? [];
  const stack: BinaryOp[][] = [[]];
  let ambiguous = false;

  for (const token of tokens) {
    switch (token) {
      case '(':
      case '\\left(':
        stack.push([]);
        break;

      case ')':
      case '\\right)':
        if (isSegmentAmbiguous(stack.pop() ?? [])) {
          ambiguous = true;
        }
        break;

      case '\\cup':
      case '\\cap':
      case '\\setminus':
      case '\\triangle':
        stack.at(-1)!.push(token);
        break;
    }
  }

  while (stack.length > 0) {
    if (isSegmentAmbiguous(stack.pop()!)) ambiguous = true;
  }

  return ambiguous;
};

// this remains true as long as MathJSON is used to parse for both this and the main engine
export const getDisambiguatedLatex = (latex: string): string | null => {
  const parsed = parseMathJSON(latex);
  if (!parsed || !parsed.isValid) return null;
  return mathJsonToLatex(parsed.json);
};
