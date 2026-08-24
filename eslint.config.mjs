// @ts-check
import eslint from '@eslint/js';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import pluginVue from 'eslint-plugin-vue';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/.nuxt/**',
      '**/.output/**',
      '**/storybook-static/**',
      '**/*.tsbuildinfo',
    ],
  },

  eslint.configs.recommended,
  tseslint.configs.recommended,

  // essential rather than recommended: everything above essential in
  // eslint-plugin-vue is template formatting (attribute order, self closing,
  // indentation), which prettier already owns and formats differently
  pluginVue.configs['flat/essential'],

  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: { parser: tseslint.parser },
    },
  },

  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },

    rules: {
      // typescript resolves identifiers, and this rule does not understand
      // the ambient types nuxt and vite generate, so every hit is a false one
      'no-undef': 'off',

      // 136 hits, and turning them into unknown is a type audit, not a lint
      // pass. worth doing on its own terms later rather than as a condition
      // of switching the linter on
      '@typescript-eslint/no-explicit-any': 'off',

      // the codebase uses `{}` and empty interfaces deliberately, to extend a
      // base props type without adding to it
      '@typescript-eslint/no-empty-object-type': 'off',

      // components live in directories that already name them, and single
      // word filenames are the convention here
      'vue/multi-word-component-names': 'off',

      // a leading underscore is how this codebase marks a binding it has to
      // accept but does not use, most often a destructured tuple slot.
      // ignoreRestSiblings covers the other direction, `const { drop, ...rest }
      // = obj`, where naming a key is how you omit it and the binding is
      // meant to go unread
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },

  // last, so it wins: drops every rule that would fight prettier
  prettier,
);
