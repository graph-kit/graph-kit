import { describe, expect, test } from 'vitest';

import { parseTextSegments } from './parseTextSegments.ts';

describe(parseTextSegments, () => {
  test('returns a single unbracketed segment for plain text', () => {
    expect(parseTextSegments('no brackets here')).toEqual([
      { bracketType: undefined, text: 'no brackets here' },
    ]);
  });

  test('parses a square-bracketed segment', () => {
    expect(parseTextSegments('[Node A]')).toEqual([
      { bracketType: 'square', text: 'Node A' },
    ]);
  });

  test('parses a curly-bracketed segment', () => {
    expect(parseTextSegments('{node-a}')).toEqual([
      { bracketType: 'curly', text: 'node-a' },
    ]);
  });

  test('splits leading, bracketed, and trailing text', () => {
    expect(parseTextSegments('Looking at [Node A] now')).toEqual([
      { bracketType: undefined, text: 'Looking at ' },
      { bracketType: 'square', text: 'Node A' },
      { bracketType: undefined, text: ' now' },
    ]);
  });

  test('handles adjacent bracketed segments with no text between them', () => {
    expect(parseTextSegments('[Foo][Bar]')).toEqual([
      { bracketType: 'square', text: 'Foo' },
      { bracketType: 'square', text: 'Bar' },
    ]);
  });

  test('handles a mix of curly and square brackets', () => {
    expect(
      parseTextSegments('Comparing {node-a} to {node-b} for [Reason]'),
    ).toEqual([
      { bracketType: undefined, text: 'Comparing ' },
      { bracketType: 'curly', text: 'node-a' },
      { bracketType: undefined, text: ' to ' },
      { bracketType: 'curly', text: 'node-b' },
      { bracketType: undefined, text: ' for ' },
      { bracketType: 'square', text: 'Reason' },
    ]);
  });

  test('parses an angle-bracketed fraction', () => {
    expect(parseTextSegments('<5/2>')).toEqual([
      { bracketType: 'angle', text: '5/2' },
    ]);
    expect(parseTextSegments('<3>')).toEqual([
      { bracketType: 'angle', text: '3' },
    ]);
    expect(parseTextSegments('<-1/3>')).toEqual([
      { bracketType: 'angle', text: '-1/3' },
    ]);
  });

  test('parses an angle-bracketed decimal', () => {
    expect(parseTextSegments('<3.5>')).toEqual([
      { bracketType: 'angle', text: '3.5' },
    ]);
    expect(parseTextSegments('<-0.25>')).toEqual([
      { bracketType: 'angle', text: '-0.25' },
    ]);
  });

  test('parses the repeating decimal a stringified Fraction produces', () => {
    expect(parseTextSegments('<0.(3)>')).toEqual([
      { bracketType: 'angle', text: '0.(3)' },
    ]);
    expect(parseTextSegments('<-0.1(6)>')).toEqual([
      { bracketType: 'angle', text: '-0.1(6)' },
    ]);
  });

  test('parses an angle-bracketed fraction with a precision suffix', () => {
    expect(parseTextSegments('<1/3:2>')).toEqual([
      { bracketType: 'angle', text: '1/3:2' },
    ]);
    expect(parseTextSegments('<0.(3):2>')).toEqual([
      { bracketType: 'angle', text: '0.(3):2' },
    ]);
  });

  test('splits text around an angle-bracketed fraction', () => {
    expect(parseTextSegments('costs <5/2> total')).toEqual([
      { bracketType: undefined, text: 'costs ' },
      { bracketType: 'angle', text: '5/2' },
      { bracketType: undefined, text: ' total' },
    ]);
  });

  test('leaves angle brackets that hold no fraction as plain text', () => {
    expect(parseTextSegments('a < b and c > d')).toEqual([
      { bracketType: undefined, text: 'a < b and c > d' },
    ]);
    expect(parseTextSegments('<not a fraction>')).toEqual([
      { bracketType: undefined, text: '<not a fraction>' },
    ]);
    expect(parseTextSegments('<3.>')).toEqual([
      { bracketType: undefined, text: '<3.>' },
    ]);
  });

  test('handles a mix of every bracket type', () => {
    expect(parseTextSegments('{node-a} pays <1/3> for [Reason]')).toEqual([
      { bracketType: 'curly', text: 'node-a' },
      { bracketType: undefined, text: ' pays ' },
      { bracketType: 'angle', text: '1/3' },
      { bracketType: undefined, text: ' for ' },
      { bracketType: 'square', text: 'Reason' },
    ]);
  });

  test('returns an empty array for an empty string', () => {
    expect(parseTextSegments('')).toEqual([]);
  });

  test('parses empty bracket contents', () => {
    expect(parseTextSegments('[]{}')).toEqual([
      { bracketType: 'square', text: '' },
      { bracketType: 'curly', text: '' },
    ]);
  });
});
