/** the subset of vite's env this package reads, see https://vite.dev/guide/env-and-mode */
interface ImportMetaEnv {
  readonly DEV: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
