import { assert } from '@core/utils/assert';
import type { Color } from '@core/utils/colors';
import tinycolor from 'tinycolor2';

import type { InterpolationFunction } from './types.ts';

/**
 * @returns true if the supplied string can be parsed as a color
 */
export const isColorString = (color: Color) => isColor(tinycolor(color));
export const isColor = (color: tinycolor.Instance) => color.isValid();

export const interpolateColor: InterpolationFunction<Color> =
  (keyframes, defaultEasing, fallback) => (progress) => {
    // "none" color cannot be interpolated
    keyframes = keyframes.filter((kf) => kf.value !== 'none');
    if (keyframes.length === 0) return fallback;

    // TODO replace with more forgiving dev warning and drop the keyframes with invalid colors
    const validColors = keyframes.map((kf) => tinycolor(kf.value));
    assert(validColors.every(isColor), 'Invalid color provided in keyframe.');

    for (let i = 0; i < keyframes.length - 1; i++) {
      const startKeyframe = keyframes[i];
      const endKeyframe = keyframes[i + 1];

      if (
        progress >= startKeyframe.progress &&
        progress <= endKeyframe.progress
      ) {
        const range = endKeyframe.progress - startKeyframe.progress;
        const localProgress = (progress - startKeyframe.progress) / range;
        const easingFn = startKeyframe.easing ?? defaultEasing;
        const easedProgress = easingFn(localProgress);

        const startRgba = tinycolor(startKeyframe.value).toRgb();
        const endRgba = tinycolor(endKeyframe.value).toRgb();

        const r = startRgba.r + (endRgba.r - startRgba.r) * easedProgress;
        const g = startRgba.g + (endRgba.g - startRgba.g) * easedProgress;
        const b = startRgba.b + (endRgba.b - startRgba.b) * easedProgress;
        const a = startRgba.a + (endRgba.a - startRgba.a) * easedProgress;

        return tinycolor({ r, g, b, a }).toRgbString();
      }
    }

    return fallback;
  };
