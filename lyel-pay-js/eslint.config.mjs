import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // The v0 client (LyelPay, loadLyelPay) targets the retired /intention API and is linted out until it is removed.
  { ignores: ['dist', 'node_modules', 'examples', 'src/sdk.ts', 'src/loadLyelPay.ts', 'src/global.ts', 'src/types.ts', 'src/shared.ts', 'src/constants.ts'] },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      globals: globals.browser,
      parserOptions: { project: './tsconfig.test.json', tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
    },
  },
  {
    files: ['eslint.config.mjs', 'rollup.config.mjs'],
    extends: [tseslint.configs.disableTypeChecked],
  },
);
