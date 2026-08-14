import tailwindcss from '@tailwindcss/vite';

export default defineNuxtConfig({
  compatibilityDate: '2026-07-09',

  ssr: true,

  devtools: { enabled: false },

  nitro: {
    prerender: {
      crawlLinks: true,
      routes: ['/'],
    },
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    public: {
      // unset means multiplayer is switched off entirely, which is the correct state
      // for a deployment without a room server rather than a failure to report.
      // `pnpm dev` runs the room server alongside the client, so it defaults to that
      // one locally and stays empty for any build that has not been told otherwise
      multiplayerServerUrl:
        process.env.MULTIPLAYER_SERVER_URL ??
        (process.env.NODE_ENV === 'development'
          ? 'http://localhost:4000'
          : ''),
    },
  },

  vite: {
    plugins: [tailwindcss()],
  },

  vue: {
    compilerOptions: {
      isCustomElement: (tag) => tag === 'math-field',
    },
  },

  typescript: {
    strict: true,
  },
});
