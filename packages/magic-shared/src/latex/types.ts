import type LatexInput from './LatexInput.vue';
import type LatexInputWithPreview from './LatexInputWithPreview.vue';

/**
 * the slice of mathlive's MathfieldElement this component drives, declared here
 * because mathlive's node entry omits the class and nodenext resolves to that entry.
 */
export type MathfieldElement = HTMLElement & {
  value: string;
  inlineShortcuts: Record<string, string>;
  getValue: () => string;
  executeCommand: (command: [string, string]) => void;
};

/** the mathlive module statics this component sets, declared here for the same reason */
export type MathliveModule = {
  MathfieldElement: { soundsDirectory: string | null };
};

/** what a template ref to a LatexInput holds, including its exposed commands */
export type LatexInputInstance = InstanceType<typeof LatexInput>;

/** what a template ref to a LatexInputWithPreview holds, including its exposed commands */
export type LatexInputWithPreviewInstance = InstanceType<
  typeof LatexInputWithPreview
>;
