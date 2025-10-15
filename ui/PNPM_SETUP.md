# pnpm Setup Guide

This project uses **pnpm** (performant npm) as the package manager instead of npm or yarn.

## 🚀 Why pnpm?

- ✅ **Faster** - Up to 2x faster than npm
- ✅ **Disk space efficient** - Uses hard links and symlinks to save disk space
- ✅ **Strict** - Creates a non-flat `node_modules` by default
- ✅ **Monorepo support** - Built-in workspace support
- ✅ **Security** - Better dependency resolution

## 📦 Installation

### Install pnpm globally

```bash
# Using npm
npm install -g pnpm

# Using Homebrew (macOS)
brew install pnpm

# Using Scoop (Windows)
scoop install nodejs-lts pnpm

# Using winget (Windows)
winget install -e --id OpenJS.NodeJS.LTS
winget install -e --id pnpm.pnpm
```

### Verify installation

```bash
pnpm --version
# Should output: 9.x.x or higher
```

## 🎯 Usage

### Installing dependencies

```bash
# Install all dependencies
pnpm install

# Install with frozen lockfile (CI/CD)
pnpm install --frozen-lockfile

# Add a dependency
pnpm add <package>

# Add a dev dependency
pnpm add -D <package>

# Remove a dependency
pnpm remove <package>

# Update dependencies
pnpm update

# Update dependencies interactively
pnpm update -i
```

### Running scripts

```bash
# Run dev server
pnpm dev

# Build for production
pnpm build

# Run linter
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code
pnpm format

# Type check
pnpm typecheck
```

### pnpm-specific commands

```bash
# List installed packages
pnpm list

# Check for outdated packages
pnpm outdated

# Clean node_modules and reinstall
pnpm install --force

# Run a command in the workspace
pnpm --filter <workspace> <command>

# Execute a binary
pnpm exec <binary>

# Or use dlx for one-off executions
pnpm dlx <binary>
```

## ⚙️ Configuration

### `.npmrc`

The project includes a `.npmrc` file with pnpm-specific settings:

```ini
# pnpm configuration
shamefully-hoist=true
strict-peer-dependencies=false
auto-install-peers=true
enable-pre-post-scripts=true
```

**What these do:**

- `shamefully-hoist=true` - Creates a flat `node_modules` structure (for compatibility)
- `strict-peer-dependencies=false` - Don't fail on missing peer dependencies
- `auto-install-peers=true` - Automatically install peer dependencies
- `enable-pre-post-scripts=true` - Run pre/post scripts (like postinstall)

### `package.json`

The `packageManager` field specifies the exact pnpm version:

```json
{
  "packageManager": "pnpm@9.15.0"
}
```

This ensures everyone on the team uses the same version.

## 🔄 Migrating from npm/yarn

### If you're used to npm

| npm command           | pnpm equivalent                  |
| --------------------- | -------------------------------- |
| `npm install`         | `pnpm install`                   |
| `npm install <pkg>`   | `pnpm add <pkg>`                 |
| `npm uninstall <pkg>` | `pnpm remove <pkg>`              |
| `npm update`          | `pnpm update`                    |
| `npm run <script>`    | `pnpm <script>`                  |
| `npx <binary>`        | `pnpm dlx <binary>`              |
| `npm ci`              | `pnpm install --frozen-lockfile` |

### If you're used to yarn

| yarn command        | pnpm equivalent     |
| ------------------- | ------------------- |
| `yarn`              | `pnpm install`      |
| `yarn add <pkg>`    | `pnpm add <pkg>`    |
| `yarn remove <pkg>` | `pnpm remove <pkg>` |
| `yarn upgrade`      | `pnpm update`       |
| `yarn <script>`     | `pnpm <script>`     |
| `yarn dlx <binary>` | `pnpm dlx <binary>` |

### Clean up old lock files

```bash
# Remove old lock files
rm -rf node_modules package-lock.json yarn.lock

# Install with pnpm
pnpm install
```

## 🛠️ Troubleshooting

### "Module not found" errors

```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm store prune
pnpm install
```

### Permission errors

```bash
# Fix pnpm store permissions
pnpm store prune
pnpm setup
```

### Peer dependency warnings

If you see peer dependency warnings, they're usually safe to ignore. The project is configured with `auto-install-peers=true` which handles them automatically.

## 📚 Advanced Usage

### Filtering packages (for monorepos)

```bash
# Run a command in a specific workspace
pnpm --filter ui dev

# Run in all workspaces
pnpm -r <command>
```

### Store management

```bash
# Show store location
pnpm store path

# Show store size
pnpm store status

# Clean unused packages from store
pnpm store prune
```

### Environment variables

```bash
# Set store location
PNPM_HOME=/custom/path pnpm install

# Use a different registry
pnpm config set registry https://registry.npmjs.org/
```

## 🎯 Best Practices

1. **Always commit `pnpm-lock.yaml`** - It ensures reproducible installs
2. **Use `--frozen-lockfile` in CI** - Prevents lockfile changes
3. **Don't mix package managers** - Stick to pnpm only
4. **Update pnpm regularly** - Run `pnpm self-update`
5. **Use workspace protocol** - For monorepo dependencies

## 🔗 Resources

- [pnpm Documentation](https://pnpm.io/)
- [pnpm CLI Reference](https://pnpm.io/cli/add)
- [pnpm Configuration](https://pnpm.io/npmrc)
- [Benchmarks](https://pnpm.io/benchmarks)

## ❓ FAQ

### Why not npm or yarn?

pnpm is faster, more disk-efficient, and has better dependency management. It's used by companies like Microsoft, ByteDance, and many others.

### Is pnpm compatible with npm packages?

Yes! pnpm is fully compatible with all npm packages. You can use it as a drop-in replacement for npm.

### Can I use pnpm with existing projects?

Yes! Just run `pnpm import` to convert your existing `package-lock.json` or `yarn.lock` to `pnpm-lock.yaml`.

### How do I update pnpm?

```bash
pnpm self-update
```

---

**Happy coding with pnpm! 🚀**
