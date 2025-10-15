import antfu from '@antfu/eslint-config'

export default antfu({
  vue: true,
  typescript: {
    tsconfigPath: 'tsconfig.json',
  },
  stylistic: {
    indent: 2,
    quotes: 'single',
    semi: false,
  },
  markdown: false, // Disable markdown linting
  jsonc: false,
  yaml: false,
  ignores: [
    '**/node_modules',
    '**/dist',
    '**/.nuxt',
    '**/.output',
    '**/public',
    '**/*.min.*',
    '**/ultrahdr_app.js',
    '**/ultrahdr_app.wasm',
    '**/wasm-files',
    '**/.vscode',
    '**/.github',
    '**/*.md',
  ],
  rules: {
    // Disable strict boolean checks for cleaner code
    'ts/strict-boolean-expressions': 'off',
    'ts/no-misused-promises': 'off',
    'ts/no-unsafe-call': 'off',
    'ts/no-unsafe-member-access': 'off',
    'ts/restrict-template-expressions': 'off',
    'no-useless-catch': 'off',
    'ts/no-unsafe-assignment': 'off',
    'ts/no-unsafe-argument': 'off',
    'vars-on-top': 'off',
    'no-console': 'off', // Allow console for debugging
  },
})
