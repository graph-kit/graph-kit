import { describe, expect, test } from 'vitest';

import type { TextAreaWithDefaults } from '../../text/defaults.ts';
import { EASING_PRESETS } from '../easing.ts';
import { interpolateTextArea } from './textArea.ts';
import type { AnimationKeyframe } from './types.ts';

const { linear } = EASING_PRESETS;

type TextAreaKeyframe = AnimationKeyframe<TextAreaWithDefaults>;

const textArea = (
  overrides: Partial<Omit<TextAreaWithDefaults, 'textBlock'>> & {
    textBlock?: Partial<TextAreaWithDefaults['textBlock']>;
  } = {},
): TextAreaWithDefaults => ({
  id: 'text-area-1',
  color: '#000000',
  activeColor: '#ffffff',
  ...overrides,
  textBlock: {
    content: 'hello',
    fontSize: 12,
    fontWeight: 'normal',
    color: '#000000',
    fontFamily: 'Arial',
    ...overrides.textBlock,
  },
});

describe('interpolateTextArea', () => {
  test('falls back on every field when there are no keyframes', () => {
    const fallback = textArea();

    expect(interpolateTextArea([], linear, fallback)(0.5)).toEqual(fallback);
  });

  test('blends the matte, text color, active color and font size together', () => {
    const keyframes: TextAreaKeyframe[] = [
      {
        progress: 0,
        value: textArea({
          color: '#000000',
          activeColor: '#000000',
          textBlock: { color: '#000000', fontSize: 10 },
        }),
      },
      {
        progress: 1,
        value: textArea({
          color: '#ffffff',
          activeColor: '#ffffff',
          textBlock: { color: '#ffffff', fontSize: 20 },
        }),
      },
    ];

    const result = interpolateTextArea(keyframes, linear, textArea())(0.5);

    expect(result.color).toBe('rgb(128, 128, 128)');
    expect(result.activeColor).toBe('rgb(128, 128, 128)');
    expect(result.textBlock.color).toBe('rgb(128, 128, 128)');
    expect(result.textBlock.fontSize).toBe(15);
  });

  test('carries identity and unanimated text fields over from the fallback', () => {
    const keyframes: TextAreaKeyframe[] = [
      { progress: 0, value: textArea({ textBlock: { content: 'ignored' } }) },
      { progress: 1, value: textArea({ textBlock: { content: 'ignored' } }) },
    ];
    const fallback = textArea({
      id: 'the-real-one',
      textBlock: {
        content: 'kept',
        fontFamily: 'Comic Sans MS',
        fontWeight: 'bold',
      },
    });

    const result = interpolateTextArea(keyframes, linear, fallback)(0.5);

    expect(result.id).toBe('the-real-one');
    expect(result.textBlock.content).toBe('kept');
    expect(result.textBlock.fontFamily).toBe('Comic Sans MS');
    expect(result.textBlock.fontWeight).toBe('bold');
  });

  test('leaves a matteless text area matteless, whatever the keyframes say', () => {
    const keyframes: TextAreaKeyframe[] = [
      { progress: 0, value: textArea({ color: '#000000' }) },
      { progress: 1, value: textArea({ color: '#ffffff' }) },
    ];
    const fallback = textArea({ color: undefined });

    expect(
      interpolateTextArea(keyframes, linear, fallback)(0.5).color,
    ).toBeUndefined();
  });

  test('treats a keyframe with no matte as the fallback matte', () => {
    const keyframes: TextAreaKeyframe[] = [
      { progress: 0, value: textArea({ color: undefined }) },
      { progress: 1, value: textArea({ color: '#ffffff' }) },
    ];
    const fallback = textArea({ color: '#000000' });

    expect(interpolateTextArea(keyframes, linear, fallback)(0.5).color).toBe(
      'rgb(128, 128, 128)',
    );
  });

  test('honours per-keyframe easing', () => {
    const keyframes: TextAreaKeyframe[] = [
      {
        progress: 0,
        value: textArea({ textBlock: { fontSize: 0 } }),
        easing: EASING_PRESETS.in,
      },
      { progress: 1, value: textArea({ textBlock: { fontSize: 100 } }) },
    ];

    expect(
      interpolateTextArea(keyframes, linear, textArea())(0.5).textBlock
        .fontSize,
    ).toBe(25);
  });
});
