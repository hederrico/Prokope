// ESLint simples: recomendados do JS e do TypeScript, regras dos hooks e do React Refresh.
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default tseslint.config(
  {
    ignores: ['dist', 'dev-dist', 'docs', 'public', 'node_modules', 'test-results', 'playwright-report', 'coverage'],
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended, reactHooks.configs.flat['recommended-latest']],
    languageOptions: {
      ecmaVersion: 2023,
      globals: { ...globals.browser },
    },
    plugins: { 'react-refresh': reactRefresh },
    rules: {
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['*.config.{js,ts}', 'tests/**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.node } },
  },
);
