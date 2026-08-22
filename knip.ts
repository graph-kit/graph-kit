import type { KnipConfig } from 'knip';

// every package declares subpath `exports`, and knip reads those as entry
// points on its own. the entries below are only the things exports cannot
// describe: tests, stories, and the client's file-routed pages
const config: KnipConfig = {
  workspaces: {
    '.': {
      project: ['*.{ts,mjs}'],
    },

    'packages/*': {
      entry: ['src/**/*.{test,spec}.ts'],
      project: ['src/**/*.{ts,vue}'],
    },

    'packages/canvas-primitives': {
      entry: [
        'src/**/*.{test,spec}.ts',
        'src/**/*.stories.ts',
        '.storybook/*.ts',
      ],
      project: ['src/**/*.{ts,vue}', '.storybook/*.ts'],
    },

    'packages/magic-client': {
      entry: ['pages/**/*.vue'],
      project: ['{app,pages,components,composables,layouts}/**/*.{ts,vue}'],
    },
  },

  // knip 6 ships compilers for svelte and mdx but not vue, so a .vue file is
  // opaque to it and every component reads as unused. pulling the script
  // blocks out is enough for reachability, since that is where the imports
  // live. the template is left behind on purpose: it holds no imports, and
  // feeding markup to the resolver only invents references
  compilers: {
    vue: (text: string) =>
      [...text.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)]
        .map((match) => match[1])
        .join('\n'),
  },
};

export default config;
