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

    // nuxt reaches these by convention rather than by import: pages are
    // file-routed, composables and plugins are auto-imported, and server/routes
    // is nitro's own file-routing. none of them is referenced from anywhere
    // knip can see, so each has to be named an entry or it reads as dead
    'packages/magic-client': {
      entry: [
        'pages/**/*.vue',
        'composables/**/*.ts',
        'plugins/**/*.ts',
        'server/**/*.ts',
      ],
      project: [
        '{app,pages,components,composables,layouts,plugins,server}/**/*.{ts,vue}',
      ],
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
