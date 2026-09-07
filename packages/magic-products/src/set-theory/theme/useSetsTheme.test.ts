import { CURSOR_FALLBACK, canvasCursorOverride } from '@core/themes/index';
import { CURSOR } from '@core/utils/cursor';
import { describe, expect, it } from 'vitest';

import { dark, light } from './presets.ts';
import { useSetsTheme } from './useSetsTheme.ts';

describe('the sets theme', () => {
  it('resolves from the light preset until told otherwise', () => {
    const theme = useSetsTheme();
    expect(theme._resolveToken('canvas.color')).toBe(light['canvas.color']);

    theme.setActivePreset('dark');
    expect(theme._resolveToken('canvas.color')).toBe(dark['canvas.color']);
  });

  it('resolves a token that takes an argument', () => {
    const theme = useSetsTheme();
    expect(theme._resolveToken('canvas.patternColor', '80')).toContain('80');
  });

  describe('the canvas cursor', () => {
    it('defers to whatever the pointer is over by default', () => {
      const theme = useSetsTheme();

      expect(theme._resolveToken('canvas.cursor')).toBe(CURSOR_FALLBACK);
      expect(
        canvasCursorOverride(theme._resolveToken('canvas.cursor')),
      ).toBeUndefined();
    });

    it('still defers while a layer has no opinion, which is how grab survives', () => {
      const theme = useSetsTheme();
      let dragging = false;

      theme
        .createLayer('test')
        .set('canvas.cursor', () => (dragging ? CURSOR.GRABBING : undefined));

      expect(
        canvasCursorOverride(theme._resolveToken('canvas.cursor')),
      ).toBeUndefined();

      dragging = true;
      expect(canvasCursorOverride(theme._resolveToken('canvas.cursor'))).toBe(
        CURSOR.GRABBING,
      );
    });
  });
});
