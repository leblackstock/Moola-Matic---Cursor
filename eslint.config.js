import globals from 'globals';
import pluginJs from '@eslint/js';
import pluginReact from 'eslint-plugin-react';
import pluginPrettier from 'eslint-plugin-prettier';

export default [
  {
    files: ['**/*.{js,mjs,cjs,jsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        process: 'readonly',
      },
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      react: pluginReact,
      prettier: pluginPrettier,
    },
    rules: {
      ...pluginJs.configs.recommended.rules,
      ...pluginReact.configs.recommended.rules,
      'prettier/prettier': ['error', { ignorePattern: '/{[^{}]*}|[[^\\[\\]]*]/g' }],
      'react/no-unescaped-entities': ['error', { forbid: ['>', '}'] }],
      'no-undef': ['error', { typeof: true }],
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
];
