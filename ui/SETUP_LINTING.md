# Linting and Formatting Setup

This project uses [Anthony Fu's ESLint Config](https://github.com/antfu/eslint-config) - a comprehensive, opinionated ESLint configuration that works perfectly with Nuxt, Vue, and TypeScript.

## 🎯 What's Included

### ESLint (via @antfu/eslint-config)

- ✅ **TypeScript** support with type-aware rules
- ✅ **Vue 3** and Nuxt-specific rules
- ✅ **Auto-fix** on save
- ✅ **Import sorting** and organization
- ✅ **Stylistic rules** for consistent code style
- ✅ **Unused imports** removal
- ✅ **Flat config** format (modern ESLint)

### Prettier

- ✅ **Consistent formatting** for CSS, HTML, and Markdown
- ✅ **Integrated** with ESLint via formatters
- ✅ **VSCode integration** for format on save

## 📦 Installation

The dependencies are already in `package.json`. Just run:

```bash
# Install pnpm globally (if not already installed)
npm install -g pnpm

# Install project dependencies
pnpm install
```

This will install:

- `@antfu/eslint-config` - The main ESLint configuration
- `eslint` - ESLint core
- `eslint-plugin-format` - For Prettier integration
- `prettier` - Code formatter

## 🚀 Usage

### Command Line

```bash
# Lint all files
pnpm lint

# Lint and auto-fix (includes formatting)
pnpm lint:fix

# Type check
pnpm typecheck
```

### VSCode Integration

With the provided VSCode settings (`.vscode/settings.json`), ESLint will:

- ✅ Auto-fix on save
- ✅ Show inline errors and warnings
- ✅ Organize imports
- ✅ Apply consistent formatting

Make sure you have the recommended extensions installed:

- **ESLint** (dbaeumer.vscode-eslint)
- **Prettier** (esbenp.prettier-vscode)
- **Vue - Official** (Vue.volar)

## ⚙️ Configuration

### ESLint Config (`eslint.config.ts`)

The configuration is highly customized for this project:

```typescript
import antfu from '@antfu/eslint-config'

export default antfu({
  // TypeScript with type-aware rules
  typescript: {
    tsconfigPath: 'tsconfig.json',
  },

  // Vue 3 support
  vue: true,

  // Stylistic rules
  stylistic: {
    indent: 2,
    quotes: 'single',
    semi: false,
  },

  // Prettier for CSS, HTML, Markdown
  formatters: {
    css: 'prettier',
    html: 'prettier',
    markdown: 'prettier',
  },
})
```

### Stylistic Rules

ESLint handles all formatting with built-in stylistic rules:
- Single quotes
- No semicolons
- 2-space indentation
- 100 character line width
- Always use parentheses for arrow functions

## 🎨 Code Style

### Key Rules

#### Vue

- **Component naming**: PascalCase in templates
- **Event naming**: camelCase
- **Block order**: `<script>` → `<template>` → `<style>`
- **Self-closing tags**: Always use self-closing for void and component tags

#### TypeScript

- **Type imports**: Always use `type` keyword for type imports
- **Interface vs Type**: Prefer `interface` over `type` for object types
- **Consistent types**: Use consistent type definitions

#### General

- **No semicolons** at the end of statements
- **Single quotes** for strings
- **2 spaces** for indentation
- **Trailing commas** in ES5-compatible positions
- **Arrow functions**: Always use parentheses for parameters
- **Console**: Only `console.warn` and `console.error` allowed

### Example

```typescript
// ✅ Good
import type { ProcessingFile } from '~/types'

// ❌ Bad
import { ProcessingFile } from '~/types'

interface Props {
  file: ProcessingFile
}

const props = defineProps<Props>()

function handleClick(event: MouseEvent): void {
  console.warn('Button clicked')
} // Missing 'type' keyword

interface Props {
  // Should be 'interface'
  file: ProcessingFile
}

const props = defineProps<Props>() // Unnecessary semicolon

function handleClick(event) {
  // Missing type annotation
  console.log('Button clicked') // console.log not allowed
}
```

## 🔧 Customization

### Override Rules

You can override rules in `eslint.config.ts`:

```typescript
export default antfu(
  {
    // ... base config
  },
  {
    // Custom rules
    rules: {
      'no-console': 'off', // Allow console.log
      'vue/multi-word-component-names': 'error', // Enforce multi-word names
    },
  }
)
```

### File-Specific Rules

```typescript
export default antfu(
  // ... base config
  {
    // Rules for specific files
    files: ['**/nuxt.config.ts'],
    rules: {
      'no-console': 'off',
    },
  }
)
```

## 🚫 Ignoring Files

Files are ignored via the `ignores` array in `eslint.config.ts`:

```typescript
ignores: [
  '**/node_modules',
  '**/.nuxt',
  '**/dist',
  '**/ultrahdr_app.js', // Generated WASM files
]
```


## 🐛 Troubleshooting

### ESLint Not Working in VSCode

1. Restart VSCode
2. Check Output panel: View → Output → ESLint
3. Make sure ESLint extension is installed and enabled
4. Check if `eslint.config.ts` has no syntax errors

### "Cannot find module" Errors

```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### No Prettier Conflicts

This project uses **ESLint only** for both linting and formatting. No Prettier, no conflicts!

### Type Errors in `eslint.config.ts`

Make sure TypeScript is properly configured:

```bash
pnpm typecheck
```

## 📚 Resources

- [Anthony Fu's ESLint Config](https://github.com/antfu/eslint-config)
- [ESLint Flat Config](https://eslint.org/docs/latest/use/configure/configuration-files-new)
- [Vue Style Guide](https://vuejs.org/style-guide/)
- [TypeScript ESLint](https://typescript-eslint.io/)

## 🎯 Benefits

### For Developers

- ✅ **No configuration needed** - Works out of the box
- ✅ **Auto-fix on save** - Less manual formatting
- ✅ **Consistent style** - Across the entire team
- ✅ **Better code quality** - Catch errors early
- ✅ **Type-safe** - TypeScript type checking integrated

### For the Project

- ✅ **Maintainability** - Consistent code is easier to maintain
- ✅ **Fewer bugs** - ESLint catches common mistakes
- ✅ **Better reviews** - Focus on logic, not style
- ✅ **Modern practices** - Up-to-date with latest standards

## 🔄 What Changed

### From Old Setup:
- ❌ Removed Prettier (ESLint handles formatting now)
- ❌ Removed `.prettierrc` and `.prettierignore`
- ❌ Removed old `.eslintrc.json` format

### New Setup:
- ✅ Modern `eslint.config.ts` (flat config format)
- ✅ Built-in stylistic formatting
- ✅ Simpler tooling - one tool for everything
- ✅ No Prettier/ESLint conflicts

No action needed - the project is fully configured! 🎉

---

**Happy coding with consistent, high-quality code! 🚀**
