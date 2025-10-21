#!/bin/bash

set -e

echo "🔨 Building libultrahdr for WASM with XMP support..."

# Check if emscripten is available
if ! command -v emcc &> /dev/null; then
    echo "❌ Error: Emscripten is not installed or not in PATH"
    echo "Please install Emscripten SDK from: https://emscripten.org/docs/getting_started/downloads.html"
    exit 1
fi

# Create build directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_DIR="${SCRIPT_DIR}/build"
PUBLIC_DIR="${SCRIPT_DIR}/public"

rm -rf "${BUILD_DIR}"
mkdir -p "${BUILD_DIR}" "${PUBLIC_DIR}"

# Clone libultrahdr if not exists
if [ ! -d "${SCRIPT_DIR}/libultrahdr" ]; then
    echo "📦 Cloning libultrahdr..."
    cd "${SCRIPT_DIR}"
    git clone https://github.com/google/libultrahdr.git
fi

cd "${BUILD_DIR}"

echo "🔧 Configuring with CMake..."
emcmake cmake ../libultrahdr \
    -DCMAKE_BUILD_TYPE=Release \
    -DUHDR_BUILD_EXAMPLES=ON \
    -DUHDR_BUILD_TESTS=OFF \
    -DUHDR_BUILD_BENCHMARK=OFF \
    -DUHDR_BUILD_FUZZERS=OFF \
    -DUHDR_ENABLE_LOGS=ON \
    -DUHDR_WRITE_XMP=ON \
    -DCMAKE_CXX_FLAGS="-s EXPORTED_FUNCTIONS='[_main]' -s EXPORTED_RUNTIME_METHODS='[FS,callMain]' -s ALLOW_MEMORY_GROWTH=1 -s MODULARIZE=1 -s EXPORT_NAME='UltraHDRModule'"

echo "🔨 Building..."
emmake make -j$(nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo 4)

echo "📦 Copying WASM files to public/..."
# Try multiple possible locations
COPIED=false

if [ -f "${BUILD_DIR}/ultrahdr_app.js" ]; then
    cp "${BUILD_DIR}/ultrahdr_app.js" "${PUBLIC_DIR}/"
    cp "${BUILD_DIR}/ultrahdr_app.wasm" "${PUBLIC_DIR}/"
    COPIED=true
    echo "✅ Copied from build root"
fi

if [ -f "${BUILD_DIR}/examples/ultrahdr_app.js" ]; then
    cp "${BUILD_DIR}/examples/ultrahdr_app.js" "${PUBLIC_DIR}/"
    cp "${BUILD_DIR}/examples/ultrahdr_app.wasm" "${PUBLIC_DIR}/"
    COPIED=true
    echo "✅ Copied from examples/"
fi

if [ "$COPIED" = false ]; then
    echo "⚠️  WASM files not found. Searching..."
    find "${BUILD_DIR}" -name "ultrahdr_app.*" -exec ls -la {} \;
    exit 1
fi

# Verify files exist
if [ -f "${PUBLIC_DIR}/ultrahdr_app.js" ] && [ -f "${PUBLIC_DIR}/ultrahdr_app.wasm" ]; then
    echo ""
    echo "✅ Build complete!"
    echo "📁 WASM files copied to: ${PUBLIC_DIR}/"
    ls -lh "${PUBLIC_DIR}/ultrahdr_app."*
    echo ""
    echo "🚀 To run the UI:"
    echo "   pnpm dev"
    echo "   Open: http://localhost:3001"
else
    echo "❌ Error: WASM files were not created successfully"
    exit 1
fi

