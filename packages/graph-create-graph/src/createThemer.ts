import { nullThrows } from '@core/utils/assert';
import { generateId } from '@core/utils/id';
import { LooseGraphPlugin, PluginThemes } from '@graph/plugins-shared/plugins';
import { DeepPartial } from 'ts-essentials';

type ThemeOverrides<GraphPlugins extends LooseGraphPlugin[]> = DeepPartial<
  PluginThemes<GraphPlugins>
>;

/** Lifecycle handle for a set of theme overrides. */
export type Themer = {
  /** Applies the theme overrides to graph. */
  activate: () => void;
  /** Removes the theme overrides from graph. */
  deactivate: () => void;
  isActive: () => boolean;
};

export const createThemer =
  // controls type is ExtractControls<NoInfer<TPlugins>>
  // but since it doesn't buy us type safety but adds overhead to the type checker
  // using any instead
  <T extends LooseGraphPlugin[]>(controls: any) =>
    (themeOverrides: ThemeOverrides<T>): Themer => {
      const layerId = generateId();

      let isActive = false;

      const pluginNames = Object.keys(
        themeOverrides,
      ) as (keyof ThemeOverrides<T>)[];

      const layers = {} as any;
      for (const pluginName of pluginNames) {
        layers[pluginName] = controls[pluginName].theme.createLayer(layerId);
      }

      const getLayer = (pluginName: keyof ThemeOverrides<T>) =>
        nullThrows(layers[pluginName], 'layers is created with pluginNames');

      const activate = () => {
        isActive = true;
        for (const pluginName of pluginNames) {
          const layer = getLayer(pluginName);

          const pluginOverrides = themeOverrides[pluginName];
          if (!pluginOverrides) continue;

          for (const [tokenName, themeValue] of Object.entries(
            pluginOverrides,
          )) {
            // DeepPartial allows explicit `undefined` values, so guard even though no real caller would pass one
            if (themeValue === undefined) continue;
            layer.set(tokenName, themeValue);
          }
        }
      };

      const deactivate = () => {
        isActive = false;
        for (const pluginName of pluginNames) {
          getLayer(pluginName).removeAll();
        }
      };

      return {
        activate,
        deactivate,
        isActive: () => isActive,
      };
    };
