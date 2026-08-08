// vite bundles css imports at build time, but nodenext resolution needs a declaration to typecheck them
declare module '*.css';
