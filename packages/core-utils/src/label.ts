type CreateLabelGeneratorOptions = {
  getLabels: () => string[];
  sequence: string[];
};

/**
 * @example
 * const generateLabel = createLabelGenerator({ getLabels: () => activeLabels, sequence: "ABC" });
 *
 * console.log(generateLabel()); // "A"
 * // add "A" to activeLabels
 * console.log(generateLabel()); // "B"
 * // remove "A" from activeLabels
 * console.log(generateLabel()); // "A"
 */
export const createLabelGenerator =
  ({ getLabels, sequence }: CreateLabelGeneratorOptions) =>
  () => {
    const labels = getLabels();

    for (let tier = 0; ; tier++) {
      const prefix = tier === 0 ? '' : sequence[(tier - 1) % sequence.length];
      for (const char of sequence) {
        const label = prefix + char;
        if (!labels.includes(label)) return label;
      }
    }
  };
