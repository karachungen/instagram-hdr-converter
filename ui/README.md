# Instagram HDR Converter

Modern Nuxt.js application for converting HDR images using Google's libultrahdr WebAssembly module.

## Features

- 🎨 **HDR Image Processing** - Two-step conversion (decode → encode) using libultrahdr WASM
- 🔄 **Before/After Comparison** - Interactive slider to compare original vs processed images
- 📊 **Real-time Progress** - Step-by-step indicators (decoding, encoding) with progress bars
- 📁 **Batch Processing** - Process multiple images simultaneously
- 💾 **Client-side Processing** - Private and secure, images never leave your device
- ⚡ **Built with Nuxt 4** - Vue 3, TypeScript, modern tooling
- 🎨 **Beautiful UI** - Nuxt UI components, smooth animations
- 🌗 **Dark Mode** - Full dark mode support
- 📱 **Responsive Design** - Works on all devices
- ⌨️ **Keyboard Shortcuts** - ⌘P to process, ⌘L for logs
- ♿ **Accessible** - WCAG compliant

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 9.0.0

### Installation

```bash
# Install pnpm globally
npm install -g pnpm

# Install dependencies
pnpm install

# Build WASM files (first time only)
./build-wasm-docker.sh

# Run development server
pnpm dev
```

## Project Structure

```
ui/
├── public/
│   ├── ultrahdr_app.js      # WASM loader (generated)
│   └── ultrahdr_app.wasm    # WASM binary (generated)
├── assets/css/              # Global styles
├── components/              # Vue components
│   ├── ActionsBar.vue       # Process & logs buttons
│   ├── ComparisonSection.vue # Before/after results
│   ├── ErrorBoundary.vue    # Error handling
│   ├── FileItem.vue         # File list item
│   ├── FileListSection.vue  # Files list container
│   ├── FileUploadSection.vue # Upload dropzone
│   ├── ImageComparison.vue  # Image slider comparison
│   ├── LoadingState.vue     # Loading indicator
│   ├── PageFooter.vue       # Privacy info
│   ├── PageHeader.vue       # App title & status
│   ├── ProcessingLogs.vue   # Log viewer
│   └── StatsBar.vue         # Statistics cards
├── composables/             # Vue composables
│   ├── useFileProcessor.ts  # File processing
│   ├── useHdrProcessor.ts   # HDR conversion service
│   ├── useKeyboardShortcuts.ts
│   ├── useLogs.ts
│   └── useWasm.ts
├── pages/
│   └── index.vue           # Main page (clean, 300 lines)
├── types/
│   └── index.ts            # TypeScript types
└── utils/                  # Utility functions
```

## Building WASM Module

The WASM module must be built before running the app.

### Option 1: Docker (Recommended)

```bash
./build-wasm-docker.sh
```

Automatically builds and copies WASM files to `public/` directory.

### Option 2: Local Build (Requires Emscripten)

```bash
./build-wasm.sh
```

Requires Emscripten SDK installed locally.

### Verify WASM Files

```bash
ls -lh public/ultrahdr_app.*
# Should show:
# public/ultrahdr_app.js    (~77KB)
# public/ultrahdr_app.wasm  (~582KB)
```

## Available Commands

```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm preview          # Preview production build

# Code Quality
pnpm lint             # Lint code
pnpm lint:fix         # Lint and auto-fix
pnpm typecheck        # TypeScript type checking

# Utilities
pnpm clean            # Clean build artifacts
pnpm analyze          # Analyze bundle size
```

## How It Works

1. **Upload** - Drop or select HDR images (AVIF, HEIF, JPG)
2. **Process** - Click "Process All Images" or press ⌘P
3. **Watch Progress** - See real-time decoding and encoding steps
4. **Compare** - Use interactive slider to compare before/after images
5. **Review Stats** - Check file sizes, dimensions, and compression ratios

### Processing Pipeline

```
Input Image (HDR)
    ↓
Step 1: Decode HDR → RAW
    ↓
Step 2: Encode RAW → HDR (with proper dimensions)
    ↓
Output: Optimized HDR Image + Comparison View
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘P` / `Ctrl+P` | Process all images |
| `⌘L` / `Ctrl+L` | Toggle logs |

## Configuration

### Package Manager: pnpm

This project uses pnpm for better performance and disk efficiency.

```bash
# Install pnpm
npm install -g pnpm

# Basic commands
pnpm install          # Install dependencies
pnpm add <pkg>        # Add package
pnpm remove <pkg>     # Remove package
pnpm update           # Update packages
```

### Linting: ESLint

Using [@antfu/eslint-config](https://github.com/antfu/eslint-config) with auto-fix on save.

```bash
pnpm lint             # Check code
pnpm lint:fix         # Fix issues
```

### TypeScript

Strict mode enabled with full type safety.

```bash
pnpm typecheck        # Check types
```

## Troubleshooting

### WASM Module Not Loading

1. **Check files exist:**
   ```bash
   ls -la public/ultrahdr_app.*
   ```

2. **Rebuild WASM:**
   ```bash
   ./build-wasm-docker.sh
   ```

3. **Restart dev server:**
   ```bash
   pnpm dev
   ```

### TypeScript Errors

```bash
# Regenerate types
pnpm postinstall

# Check errors
pnpm typecheck
```

### Build Errors

```bash
# Clean and rebuild
pnpm clean
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm build
```

### Error: 404 /ultrahdr_app.js

**Cause:** WASM files not in `public/` directory.

**Fix:**
```bash
./build-wasm-docker.sh
pnpm dev
```

### WASM Module Load Timeout

The app waits up to 6 seconds for the WASM module to load. If it fails:

1. Check browser console for errors
2. Verify files in `public/` directory
3. Check network tab for 404 errors
4. Rebuild WASM files

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

WebAssembly support required.

## Development Workflow

1. **First time:**
   ```bash
   pnpm install
   ./build-wasm-docker.sh
   pnpm dev
   ```

2. **Regular development:**
   ```bash
   pnpm dev
   ```

3. **After pulling changes:**
   ```bash
   pnpm install
   # Rebuild WASM only if source changed
   ./build-wasm-docker.sh
   pnpm dev
   ```

4. **Production build:**
   ```bash
   ./build-wasm-docker.sh
   pnpm build
   pnpm preview
   ```

## Key Technologies

- **Nuxt 4.1.3** - Vue framework
- **Vue 3.5.22** - Progressive JavaScript framework
- **TypeScript 5.7.2** - Type safety
- **Nuxt UI 4.0.0** - Component library
- **Tailwind CSS** - Utility-first CSS
- **pnpm 9.15.0** - Package manager
- **ESLint** - Code linting with @antfu/eslint-config
- **libultrahdr** - Google's HDR library (WASM)

## Version

Current version: **2.0.0** (2025-10-15)

Major rewrite with TypeScript, improved architecture, and production-ready code quality.

## License

MIT

## Author

karachungen
