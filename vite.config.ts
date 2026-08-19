import path from 'node:path';

import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';

const r = (...p: string[]) => path.resolve(__dirname, ...p);

export default defineConfig({
  plugins: [vue()],
  test: {
    silent: true,
    environment: 'jsdom',
  },
  resolve: {
    alias: {
      '@core/annotations': r('packages/core-annotations/src'),
      '@core/themes': r('packages/core-themes/src'),
      '@core/utils': r('packages/core-utils/src'),
      '@canvas/primitives': r('packages/canvas-primitives/src'),
      '@canvas/surface': r('packages/canvas-surface/src'),
      '@magic/products': r('packages/magic-products/src'),
      '@graph/create-graph': r('packages/graph-create-graph/src'),
      '@graph/dev-tools': r('packages/graph-dev-tools/src'),
      '@graph/algorithms': r('packages/graph-algorithms/src'),
      '@graph/computed-tokens': r('packages/graph-computed-tokens/src'),
      '@graph/core': r('packages/graph-core/src'),
      '@graph/plugins': r('packages/graph-plugins/src'),
      '@graph/plugins-shared': r('packages/graph-plugins-shared/src'),
      '@graph/primitives': r('packages/graph-primitives/src'),
      '@graph/render-functions': r('packages/graph-render-functions/src'),
      '@graph/theme-presets': r('packages/graph-theme-presets/src'),
      '@graph/vue': r('packages/graph-vue/src'),
      '@multiplayer/protocol': r('packages/multiplayer-protocol/src'),
    },
  },
});
