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

  app: {
    head: {
      link: [
        {
          rel: 'icon',
          type: 'image/svg+xml',
          href: '/favicons/magic-graphs-bg-gradient.svg',
        },
      ],
    },
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    public: {
      multiplayerServerUrl:
        process.env.MULTIPLAYER_SERVER_URL ??
        (process.env.NODE_ENV === 'development' ? 'http://localhost:4000' : ''),
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
