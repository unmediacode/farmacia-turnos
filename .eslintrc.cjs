module.exports = {
  root: true,
  ignorePatterns: ['.astro/', 'dist/', 'node_modules/', '.vercel/', '.data/'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
    extraFileExtensions: ['.astro']
  },
  plugins: ['@typescript-eslint', 'astro', 'jsx-a11y'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-type-checked',
    'plugin:@typescript-eslint/stylistic-type-checked',
    'plugin:astro/recommended',
    'plugin:astro/jsx-a11y-strict',
    'plugin:jsx-a11y/strict',
    'prettier'
  ],
  overrides: [
    {
      files: ['*.astro'],
      parser: 'astro-eslint-parser',
      parserOptions: {
        parser: '@typescript-eslint/parser',
        extraFileExtensions: ['.astro'],
        project: './tsconfig.json',
        tsconfigRootDir: __dirname
      },
      rules: {
        'astro/no-set-html-directive': 'error',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off'
      }
    },
    {
      files: ['**/*.{js,ts}'],
      rules: {
        '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
        '@typescript-eslint/no-floating-promises': 'error',
        '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: false }]
      }
    }
  ],
  rules: {
    '@typescript-eslint/consistent-type-definitions': 'off',
    '@typescript-eslint/explicit-function-return-type': ['error', { allowExpressions: true }],
    '@typescript-eslint/no-explicit-any': ['error', { ignoreRestArgs: false }],
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'no-console': ['error', { allow: ['warn', 'error', 'info'] }]
  }
};
