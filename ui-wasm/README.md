# Instagram HDR Converter - Web UI

A modern web-based interface for converting HDR images using Google's libultrahdr compiled to WebAssembly.

## Features

- 🎨 Drag & drop file upload
- ⚡ Real-time HDR conversion in browser (WebAssembly)
- 🔄 Before/After image comparison
- 📦 Batch processing support
- 💾 Download individual or all converted files
- 🔒 Privacy-first: All processing happens client-side
- 🗜️ GZIP & Brotli compression enabled

## Quick Start

### Option 1: Using Docker (Recommended)

Pull and run the pre-built image from Docker Hub:

```bash
docker pull karachungen/hdr-converter-ui:latest
docker run -p 3000:3000 karachungen/hdr-converter-ui
```

Then open: http://localhost:3000

### Option 2: Build with Docker

Build the image locally (includes WASM compilation):

```bash
cd ui
docker build -t hdr-converter-ui .
docker run -p 3000:3000 hdr-converter-ui
```

**Note:** The Docker build includes compiling libultrahdr to WebAssembly using Emscripten, which may take 5-10 minutes depending on your system.

### Option 3: Local Development

#### Prerequisites

- Node.js 20.x or later
- pnpm 9.x or later
- Emscripten SDK (for WASM building)

#### Setup

1. **Build WASM files:**

```bash
# Install Emscripten if not already installed
# See: https://emscripten.org/docs/getting_started/downloads.html

# Build WASM
./build-wasm.sh

# This will create:
# - public/ultrahdr_app.js
# - public/ultrahdr_app.wasm
```

2. **Install dependencies:**

```bash
pnpm install
```

3. **Run development server:**

```bash
pnpm dev
```

Open http://localhost:3001

4. **Build for production:**

```bash
pnpm generate
```

Static files will be in `.output/public/`

## Docker Build Process

The Dockerfile uses a multi-stage build:

1. **Stage 1: WASM Builder**
   - Uses `emscripten/emsdk:3.1.51`
   - Clones and compiles libultrahdr to WebAssembly
   - Outputs: `ultrahdr_app.js` and `ultrahdr_app.wasm`

2. **Stage 2: Nuxt Builder**
   - Uses `node:20-slim`
   - Installs dependencies with pnpm
   - Copies WASM files from Stage 1
   - Generates static Nuxt site

3. **Stage 3: Production Server**
   - Uses `node:20-slim`
   - Installs `http-server`
   - Serves static files with GZIP and Brotli compression
   - Exposes port 3000

## Project Structure

```
ui/
├── Dockerfile              # Multi-stage Docker build
├── build-wasm.sh          # Local WASM build script
├── components/            # Vue components
├── composables/           # Vue composables
├── pages/                 # Nuxt pages
├── stores/                # Pinia stores
├── types/                 # TypeScript types
├── utils/                 # Utility functions
├── public/                # Static assets (WASM files go here)
└── wasm-files/            # Pre-built WASM (for reference/backup)
```

## Environment Variables

- `NODE_ENV` - Set to `production` for optimized builds
- `NUXT_TYPESCRIPT_TYPECHECK` - Enable/disable TypeScript type checking

## Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm generate` - Generate static site
- `pnpm preview` - Preview production build
- `pnpm lint` - Lint code
- `pnpm typecheck` - Run TypeScript type checking

## Technology Stack

- **Framework:** Nuxt 4.1.3
- **UI Library:** Nuxt UI
- **State Management:** Pinia
- **Language:** TypeScript
- **Package Manager:** pnpm
- **WebAssembly:** Emscripten + libultrahdr
- **Server:** http-server (with compression)

## Performance

- **Image Size:** ~231MB (production)
- **Compression:** GZIP + Brotli enabled
- **Caching:** Disabled for development (-c-1)
- **Platform Support:** linux/amd64, linux/arm64

## License

See main project LICENSE
