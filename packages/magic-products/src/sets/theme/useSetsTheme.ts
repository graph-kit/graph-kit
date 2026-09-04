import {
  type ThemeController,
  createThemeController,
} from '@core/themes/index';
import { getValue } from '@core/utils/maybeGetter/index';

import { SETS_PRESETS, type SetsPresetName } from './presets.ts';
import { type SetsThemes, createSetsThemeOverrides } from './tokens.ts';

export type SetsTheme = ThemeController<SetsThemes> & {
  /** swaps the preset the bottom layer resolves from, for light and dark */
  setActivePreset: (name: SetsPresetName) => void;
};

const PRESET_LAYER_ID = 'sets/theme-presets';

/**
 * the sets theme, layered the way a graph plugin's is: a base layer standing in
 * for the active preset, and anything else stacked above it
 */
export const useSetsTheme = (): SetsTheme => {
  const overrides = createSetsThemeOverrides();
  const controller = createThemeController(overrides);

  let activePresetName: SetsPresetName = 'light';

  const presetLayer = controller.createLayer(PRESET_LAYER_ID);

  /*
    the preset is read by name at resolve time rather than captured, so swapping
    light for dark needs no relayering. the cast is what the layered resolver
    costs: a token's value type is only known per token, and this loop is over
    all of them
  */
  const seedFromActivePreset = <Token extends keyof SetsThemes>(
    token: Token,
  ) => {
    presetLayer.set(token, ((...args: unknown[]) =>
      getValue(
        SETS_PRESETS[activePresetName][token] as never,
        ...args,
      )) as SetsThemes[Token]);
  };

  for (const token of Object.keys(overrides) as (keyof SetsThemes)[]) {
    seedFromActivePreset(token);
  }

  return {
    ...controller,
    setActivePreset: (name: SetsPresetName) => (activePresetName = name),
  };
};
