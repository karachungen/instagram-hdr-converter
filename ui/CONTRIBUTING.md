# Contributing to Instagram HDR Converter

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 9.0.0
- Git
- Code editor (VSCode recommended)

### Development Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd instagram-hdr-converter/ui
   ```

2. **Install pnpm** (if not already installed)

   ```bash
   npm install -g pnpm
   ```

3. **Install dependencies**

   ```bash
   pnpm install
   ```

4. **Start development server**

   ```bash
   pnpm dev
   ```

5. **Open browser**
   Navigate to `http://localhost:3000`

## 📋 Development Guidelines

### Code Style

We use ESLint and Prettier to maintain consistent code style.

- **Run linting**: `pnpm lint`
- **Fix linting issues**: `pnpm lint:fix`
- **Type checking**: `pnpm typecheck`

### TypeScript

- Use **strict mode** TypeScript
- Define interfaces for all props and data structures
- Avoid using `any` type (use `unknown` instead)
- Use proper type annotations
- Export types from `~/types/index.ts`

**Example:**

```typescript
// ✅ Good
interface UserData {
  id: string
  name: string
  email: string
}

async function fetchUser(id: string): Promise<UserData> {
  // implementation
}

// ❌ Bad
async function fetchUser(id: any): Promise<any> {
  // implementation
}
```

### Vue Components

- Use **Composition API** with `<script setup lang="ts">`
- Define props using TypeScript interfaces
- Use typed emits
- Add JSDoc comments for complex logic
- Keep components focused and small

**Example:**

```vue
<script setup lang="ts">
interface Props {
  title: string
  count: number
}

interface Emits {
  (e: 'update', value: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
</script>
```

### Composables

- One composable per file
- Export a single function
- Use TypeScript for all parameters and return types
- Add JSDoc documentation
- Return readonly refs when appropriate

**Example:**

```typescript
/**
 * Composable for managing user data
 */
export function useUser() {
  const user = useState<User | null>('user', () => null)

  const fetchUser = async (id: string): Promise<void> => {
    // implementation
  }

  return {
    user: readonly(user),
    fetchUser,
  }
}
```

### Commits

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `perf:` Performance improvements
- `test:` Test additions or changes
- `chore:` Build process or auxiliary tool changes

**Examples:**

```bash
git commit -m "feat: add keyboard shortcuts support"
git commit -m "fix: resolve memory leak in file processor"
git commit -m "docs: update README with new features"
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

### Writing Tests

- Write tests for all new features
- Test edge cases and error conditions
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

**Example:**

```typescript
describe('useFileProcessor', () => {
  it('should add files to the queue', () => {
    // Arrange
    const { files, addFiles } = useFileProcessor()
    const mockFiles = [new File(['content'], 'test.jpg')]

    // Act
    addFiles(mockFiles)

    // Assert
    expect(files.value).toHaveLength(1)
  })
})
```

## 📝 Documentation

- Update README.md for user-facing changes
- Add JSDoc comments for complex functions
- Update CHANGELOG.md for all changes
- Include code examples in documentation
- Document breaking changes clearly

## 🎨 UI/UX Guidelines

### Design Principles

1. **Simplicity**: Keep the interface clean and intuitive
2. **Consistency**: Use consistent patterns and components
3. **Feedback**: Provide clear feedback for all actions
4. **Accessibility**: Ensure WCAG 2.1 AA compliance
5. **Performance**: Optimize for speed and efficiency

### Component Design

- Use Nuxt UI components when possible
- Follow the existing design system
- Ensure responsive design
- Add loading states
- Handle error states gracefully

### Accessibility

- Add ARIA labels for interactive elements
- Ensure keyboard navigation works
- Test with screen readers
- Use semantic HTML
- Provide alternative text for images

## 🔍 Pull Request Process

### Before Submitting

1. **Update your branch**

   ```bash
   git checkout main
   git pull origin main
   git checkout your-branch
   git rebase main
   ```

2. **Run all checks**

   ```bash
   pnpm lint
   pnpm typecheck
   pnpm test
   pnpm build
   ```

3. **Update documentation**
   - README.md (if needed)
   - CHANGELOG.md
   - Code comments

### PR Template

Use this template for your pull request:

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

Describe how you tested your changes

## Checklist

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests added/updated
- [ ] All tests passing
- [ ] TypeScript types correct
```

### Review Process

1. Submit your PR
2. Wait for automated checks to pass
3. Address review comments
4. Get approval from maintainers
5. Squash and merge

## 🐛 Bug Reports

### Before Reporting

- Check existing issues
- Try to reproduce in latest version
- Gather relevant information

### Bug Report Template

```markdown
## Bug Description

Clear description of the bug

## Steps to Reproduce

1. Step 1
2. Step 2
3. Step 3

## Expected Behavior

What should happen

## Actual Behavior

What actually happens

## Environment

- OS: [e.g., macOS 13.0]
- Browser: [e.g., Chrome 120]
- Node version: [e.g., 18.0.0]
- App version: [e.g., 2.0.0]

## Screenshots

If applicable, add screenshots

## Additional Context

Any other relevant information
```

## 💡 Feature Requests

### Feature Request Template

```markdown
## Feature Description

Clear description of the feature

## Problem It Solves

What problem does this solve?

## Proposed Solution

How would you implement it?

## Alternatives Considered

What other solutions did you consider?

## Additional Context

Any other relevant information
```

## 🔒 Security

If you discover a security vulnerability:

1. **DO NOT** open a public issue
2. Email the maintainers directly
3. Provide detailed information
4. Wait for a response before disclosure

## 📚 Resources

### Recommended Reading

- [Vue 3 Documentation](https://vuejs.org/)
- [Nuxt 3 Documentation](https://nuxt.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)

### Tools

- [Vue DevTools](https://devtools.vuejs.org/)
- [TypeScript Playground](https://www.typescriptlang.org/play)
- [ESLint VSCode Extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)

## ❓ Questions

For questions:

- Check the documentation
- Search existing issues
- Open a new discussion
- Ask in community channels

## 🙏 Thank You

Thank you for contributing to Instagram HDR Converter! Your efforts help make this project better for everyone.

---

**Happy Coding! 🚀**
