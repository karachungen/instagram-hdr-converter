# Quick Start Guide - ESLint Setup ✨

## 🚀 Installation

```bash
# Install pnpm globally (if not already installed)
npm install -g pnpm

# Install dependencies
pnpm install

# This will install:
# - @antfu/eslint-config (ESLint preset with built-in formatters)
# - eslint (v9 with flat config)
```

## ✅ What's Configured

### ESLint Features

- ✨ **Auto-fix on save** in VSCode
- 🎯 **TypeScript** type-aware rules
- 🎨 **Vue 3** and Nuxt-specific rules
- 📦 **Import sorting** and unused import removal
- 🧹 **Stylistic rules** (indent, quotes, etc.)
- 🔧 **Flat config** format (modern ESLint)

### Prettier Integration

- 💅 **CSS, HTML, Markdown** formatting
- 🎨 **Integrated** with ESLint via formatters
- ⚡ **No conflicts** between ESLint and Prettier

## 🎮 Commands

```bash
# Lint your code
pnpm lint

# Lint and auto-fix all issues (includes formatting)
pnpm lint:fix

# Type check TypeScript
pnpm typecheck

# Run all checks (recommended before commit)
pnpm lint && pnpm typecheck
```

## 🎯 VSCode Setup

The configuration is already set up in `.vscode/`! Just:

1. **Install recommended extensions** (VSCode will prompt you):
   - ESLint
   - Prettier
   - Vue - Official (Volar)
   - Tailwind CSS IntelliSense

2. **Restart VSCode** to activate settings

3. **Start coding!** ESLint will auto-fix on save 🎉

### How Auto-Fix Works

- **On Save**: ESLint auto-fixes all issues including formatting
- **Manual**: Run `pnpm lint:fix` for all files
- **No Prettier**: ESLint handles both linting and formatting

## 📝 Code Style Highlights

```typescript
// ✅ Good - Following the style guide

// Type imports with 'type' keyword
import type { ProcessingFile } from '~/types'

// Interface for object types
interface Props {
  file: ProcessingFile
}

// Single quotes, no semicolons
const message = 'Hello World'

// Always parentheses on arrow functions
function handleClick(event: MouseEvent): void {
  console.warn('Clicked!')
}

// Trailing commas in ES5 positions
const config = {
  name: 'test',
  value: 123,
}
```

```typescript
// ❌ Bad - Style issues

import { ProcessingFile } from '~/types' // Missing 'type', unnecessary semicolon

interface Props {
  // Should use 'interface'
  file: ProcessingFile
}

const message = 'Hello World' // Double quotes, semicolon

function handleClick(event) {
  // Missing type annotation, parens
  console.log('Clicked!') // console.log not allowed
}

const config = {
  name: 'test',
  value: 123, // Missing trailing comma
}
```

## 🔧 Configuration Files

### `eslint.config.ts`

Main ESLint configuration using Anthony Fu's preset. Includes:

- TypeScript type-aware rules
- Vue 3 component rules
- Stylistic formatting rules
- Custom project-specific rules

### `.prettierrc`

Prettier configuration for CSS, HTML, and Markdown:

- No semicolons
- Single quotes
- 2-space indentation
- Trailing commas
- 100 character line width

### `.editorconfig`

Editor configuration for consistent formatting across editors:

- UTF-8 encoding
- LF line endings
- 2-space indentation
- Trim trailing whitespace

## 🎨 What Gets Linted

```
✅ Linted Files:
├── *.{ts,tsx,js,jsx} - JavaScript/TypeScript
├── *.vue - Vue components
├── *.json - JSON files
└── *.md - Markdown (formatting only)

❌ Ignored:
├── node_modules/
├── .nuxt/
├── .output/
├── dist/
└── ultrahdr_app.js/wasm (generated files)
```

## 💡 Tips

### Pre-commit Hook

Add automatic linting before commits:

```json
{
  "lint-staged": {
    "*.{js,ts,vue}": "eslint --fix",
    "*.{css,md}": "prettier --write"
  }
}
```

### CI/CD Integration

Add to your CI pipeline:

```yaml
- name: Lint
  run: npm run lint

- name: Type Check
  run: npm run typecheck

- name: Format Check
  run: npm run format:check
```

### Disable Rules Temporarily

```typescript
console.log('Debug info')

// Or for a single line:
console.log('Debug')
```

## 🐛 Troubleshooting

### ESLint not working?

```bash
# 1. Restart VSCode
# 2. Check ESLint output: View → Output → ESLint
# 3. Verify extension is enabled
# 4. Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Conflicts between ESLint and Prettier?

Don't worry! They're configured to work together. ESLint handles code quality, Prettier handles formatting via ESLint.

### TypeScript errors in config?

```bash
pnpm typecheck
```

## 📚 Learn More

- [Anthony Fu's ESLint Config](https://github.com/antfu/eslint-config) - Full documentation
- [ESLint Flat Config](https://eslint.org/docs/latest/use/configure/configuration-files-new) - New config format
- [Prettier Docs](https://prettier.io/docs/en/) - Formatting guide
- [Vue Style Guide](https://vuejs.org/style-guide/) - Official Vue recommendations

## 🎉 Ready to Go!

Your project is now configured with:

- ✅ Modern ESLint setup (v9 flat config)
- ✅ Anthony Fu's opinionated rules
- ✅ Prettier integration
- ✅ TypeScript type checking
- ✅ Vue 3 and Nuxt support
- ✅ Auto-fix on save

Just run `pnpm install` and start coding with confidence! 🚀

---

**Need help?** Check `SETUP_LINTING.md` for detailed documentation.
