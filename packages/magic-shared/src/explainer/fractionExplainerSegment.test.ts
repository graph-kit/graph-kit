import { getValue } from '@core/utils/maybeGetter/index';
import { describe, expect, test, vi } from 'vitest';

import { fractionExplainerSegment } from './fractionExplainerSegment.ts';

describe(fractionExplainerSegment, () => {
  test('shows the fraction, hovering to reveal its decimal', () => {
    const segment = fractionExplainerSegment('1/3');
    expect(getValue(segment.text)).toBe('1/3');
    expect(segment.highlight?.tooltipLabel).toBe('~0.333');
  });

  test('leaves an integer with nothing to reveal', () => {
    const segment = fractionExplainerSegment('4/2');
    expect(getValue(segment.text)).toBe('2');
    expect(segment.highlight).toBeUndefined();
  });

  test('falls back to a red ? when the fraction cannot be read', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    const segment = fractionExplainerSegment('one half');

    expect(getValue(segment.text)).toBe('?');
    expect(segment.highlight?.tooltipLabel).toBe(
      'Cannot Parse "one half" As A Fraction',
    );
    expect(error).toHaveBeenCalledWith(
      "explainer cannot parse 'one half' as a fraction",
    );

    error.mockRestore();
  });

  test('falls back when the fraction divides by zero', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(getValue(fractionExplainerSegment('1/0').text)).toBe('?');
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });
});
