type BracketType = 'angle' | 'curly' | 'square';

export type TextSegment = {
  bracketType: BracketType | undefined;
  text: string;
};

const pattern = new RegExp(
  [
    String.raw`\{([^}]*)\}`,
    String.raw`\[([^\]]*)\]`,
    String.raw`<([^<>]*)>`,
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
