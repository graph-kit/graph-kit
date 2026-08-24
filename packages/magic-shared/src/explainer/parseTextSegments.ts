type BracketType = 'angle' | 'curly' | 'square';

export type TextSegment = {
  bracketType: BracketType | undefined;
  text: string;
};

/**
 * `5`, `5/2`, `-1/3`, `3.5` or `0.(3)` (the repeating decimal fraction.js prints)
 */
const FRACTION = String.raw`-?\d+(?:\/\d+|\.(?:\d*\(\d+\)|\d+))?`;

const pattern = new RegExp(
  [
    String.raw`\{([^}]*)\}`,
    String.raw`\[([^\]]*)\]`,
    `<(${FRACTION})>`,
    // a `<` that opens no fraction is ordinary text, so stray angles are never swallowed
    String.raw`((?:[^{}[\]<]|<(?!${FRACTION}>))+)`,
  ].join('|'),
  'g',
);

export const parseTextSegments = (str: string): TextSegment[] => {
  return [...str.matchAll(pattern)].map((m) => {
    const [, curlyContent, squareContent, angleContent, plainText] = m;
    if (curlyContent !== undefined) {
      return { bracketType: 'curly', text: curlyContent };
    }
    if (squareContent !== undefined) {
      return { bracketType: 'square', text: squareContent };
    }
    if (angleContent !== undefined) {
      return { bracketType: 'angle', text: angleContent };
    }
    return { bracketType: undefined, text: plainText };
  });
};
