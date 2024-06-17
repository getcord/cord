module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2021: true,
  },
  plugins: ['@typescript-eslint', 'import', 'no-relative-import-paths'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: true,
    tsconfigRootDir: '.',
  },
  extends: [
    'eslint:recommended',
    'plugin:@cspell/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:prettier/recommended', // Must be last.
  ],
  settings: {
    'import/resolver': 'typescript',
  },
  rules: {
    curly: 'error',
    'import/order': 'error',
    'import/no-duplicates': 'error',
    'no-relative-import-paths/no-relative-import-paths': 'error',
    '@cspell/spellchecker': ['error', { checkIdentifiers: false }],
    '@typescript-eslint/consistent-type-imports': 'error',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-unsafe-argument': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    '@typescript-eslint/restrict-template-expressions': [
      'error',
      { allowAny: true, allowNumber: true },
    ],
  },
};
