import tailwindcss from '@tailwindcss/vite';

export default defineNuxtConfig({
  compatibilityDate: '2026-07-09',

  ssr: true,

  devtools: { enabled: false },

  nitro: {
    prerender: {
      crawlLinks: true,
      routes: ['/', '/sitemap.xml', '/robots.txt'],
    },
    routeRules: {
      '/sitemap.xml': {
        headers: { 'content-type': 'application/xml; charset=utf-8' },
      },
      '/robots.txt': {
        headers: { 'content-type': 'text/plain; charset=utf-8' },
      },
    },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
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
      // so multiplayer can be switched off without building/redeploying
      multiplayerConfigUrl:
        process.env.MULTIPLAYER_CONFIG_URL ?? '/multiplayer-config.json',
      posthogKey: process.env.POSTHOG_KEY ?? '',
      siteUrl: process.env.SITE_URL ?? 'https://magicgraphs.app',
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
