import { TextAreaWithDefaults } from '../../text/defaults.ts';
import { interpolateColor } from './color.ts';
import { interpolateNumber } from './number.ts';
import type {
  ColorKeyframe,
  InterpolationFunction,
  NumberKeyframe,
} from './types.ts';

export const interpolateTextArea: InterpolationFunction<
  TextAreaWithDefaults
> = (keyframes, defaultEasing, fallback) => {
  return (progress) => {
    const activeColorKeyframes = keyframes.map((kf): ColorKeyframe => ({
      ...kf,
      value: kf.value.activeColor,
    }));

    const textColorKeyframes = keyframes.map((kf): ColorKeyframe => ({
      ...kf,
      value: kf.value.textBlock.color,
    }));

    const textSizeKeyframes = keyframes.map((kf): NumberKeyframe => ({
      ...kf,
      value: kf.value.textBlock.fontSize,
    }));

    // a text area with no matte has no color to move toward, so it stays absent
    const { color: fallbackColor } = fallback;
    const textAreaColor =
      fallbackColor &&
      interpolateColor(
        keyframes.map((kf): ColorKeyframe => ({
          ...kf,
          value: kf.value.color ?? fallbackColor,
        })),
        defaultEasing,
        fallbackColor,
      );
    const textColor = interpolateColor(
      textColorKeyframes,
      defaultEasing,
      fallback.textBlock.color,
    );
    const textFontSize = interpolateNumber(
      textSizeKeyframes,
      defaultEasing,
      fallback.textBlock.fontSize,
    );
    const textAreaActiveColor = interpolateColor(
      activeColorKeyframes,
      defaultEasing,
      fallback.activeColor,
    );

    const { textBlock } = fallback;

    return {
      id: fallback.id,
      textBlock: {
        ...textBlock,
        color: textColor(progress),
        fontSize: textFontSize(progress),
      },
      color: textAreaColor ? textAreaColor(progress) : undefined,
      activeColor: textAreaActiveColor(progress),
    };
  };
};
