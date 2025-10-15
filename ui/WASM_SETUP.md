# WASM Setup Guide

This guide explains how to set up and build the WebAssembly module for the Instagram HDR Converter.

## 📁 File Structure

The WASM module consists of two files that must be placed in the `public/` directory:

```
public/
├── ultrahdr_app.js      # WASM loader (JavaScript)
└── ultrahdr_app.wasm    # WASM binary
```

## 🔧 Building WASM Files

### Option 1: Docker Build (recommended)

```bash
./build-wasm-docker.sh
```

This uses Docker to build the WASM module and **automatically copies the files to `public/`**.

### Option 2: Build Script (requires Emscripten)

```bash
./build-wasm.sh
```

This compiles the libultrahdr C++ code to WebAssembly using Emscripten and **automatically copies the files to `public/`**.

**Note**: Both scripts now automatically place the WASM files in the correct location (`public/` directory). No manual copying needed!

## ⚙️ Configuration

The Nuxt configuration (`nuxt.config.ts`) automatically loads the WASM module:

```typescript
app: {
  head: {
    script: [
      {
        src: '/ultrahdr_app.js',
        defer: true,
        tagPosition: 'bodyClose'
      }
    ]
  }
}
```

## 🔍 Verification

### 1. Check files exist

```bash
ls -lh public/ultrahdr_app.*
```

You should see both files:
```
public/ultrahdr_app.js      (~77KB)
public/ultrahdr_app.wasm    (~582KB)
```

### 2. Start dev server

```bash
pnpm dev
```

### 3. Check browser console

Open http://localhost:3001 and check the browser console:

✅ **Success**: You should see initialization logs  
❌ **Error 404**: Files are missing from `public/` directory

## 🐛 Troubleshooting

### Error: 404 (Page not found: /ultrahdr_app.js)

**Cause**: WASM files are not in the `public/` directory.

**Solution**:
```bash
# Option 1: Copy existing files to public
cp ultrahdr_app.js public/
cp ultrahdr_app.wasm public/

# Option 2: Rebuild (automatically copies to public)
./build-wasm-docker.sh

# Restart dev server
pnpm dev
```

### Error: WASM module not loading

**Cause**: Files are in wrong location or build is incomplete.

**Solution**:
```bash
# Rebuild WASM module
./build-wasm-docker.sh

# Copy to public
cp ultrahdr_app.js public/
cp ultrahdr_app.wasm public/

# Restart dev server
pnpm dev
```

### Error: Cannot access ultrahdr_app.wasm

**Cause**: WASM binary not found or CORS issues.

**Solution**:
```bash
# Verify both files exist
ls -la public/ultrahdr_app.js public/ultrahdr_app.wasm

# Check Vite server config in nuxt.config.ts
# vite.server.fs.strict should be false
```

## 📝 Git Ignore

The WASM files are gitignored (they're generated files):

```gitignore
# WASM files (generated)
ultrahdr_app.js
ultrahdr_app.wasm
wasm-files/
public/ultrahdr_app.js
public/ultrahdr_app.wasm
```

**Why?** These are built artifacts that can be regenerated. Each developer/CI should build them locally.

## 🚀 Production Build

For production, build the WASM module then build the Nuxt app:

```bash
# 1. Build WASM module (auto-copies to public/)
./build-wasm-docker.sh

# 2. Build Nuxt app
pnpm build

# 3. Preview
pnpm preview
```

## 🔄 Development Workflow

1. **First time setup**:
   ```bash
   pnpm install
   ./build-wasm-docker.sh  # Automatically copies to public/
   pnpm dev
   ```

2. **Regular development**:
   ```bash
   pnpm dev
   ```
   (WASM files stay in `public/` until rebuilt)

3. **After pulling changes**:
   ```bash
   # If WASM source changed, rebuild
   ./build-wasm-docker.sh  # Automatically copies to public/
   pnpm dev
   ```

## 📚 Additional Resources

- Check `build-wasm.sh` for local build instructions
- Check `build-wasm-docker.sh` for Docker build instructions
- See `Dockerfile.wasm` for build environment details

---

## 🎯 Quick Reference

### Build Commands
```bash
# Docker build (recommended)
./build-wasm-docker.sh

# Local build (requires Emscripten)
./build-wasm.sh
```

### Manual Copy (if needed)
```bash
# Copy existing WASM files to public
cp ultrahdr_app.js public/
cp ultrahdr_app.wasm public/
```

### Verify Files
```bash
# Check files exist in public
ls -lh public/ultrahdr_app.*

# Check files are accessible (while dev server is running)
curl -I http://localhost:3001/ultrahdr_app.js
curl -I http://localhost:3001/ultrahdr_app.wasm
```

