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
INSTALL_DIR="${SCRIPT_DIR}/wasm-output"

rm -rf "${BUILD_DIR}" "${INSTALL_DIR}"
mkdir -p "${BUILD_DIR}" "${INSTALL_DIR}"

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
    -DCMAKE_INSTALL_PREFIX="${INSTALL_DIR}"

echo "🔨 Building..."
emmake make -j$(nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo 4)

echo "📦 Installing..."
emmake make install

# Copy outputs to ui directory
cp "${BUILD_DIR}/ultrahdr_app.js" "${SCRIPT_DIR}/" 2>/dev/null || echo "⚠️  ultrahdr_app.js not found"
cp "${BUILD_DIR}/ultrahdr_app.wasm" "${SCRIPT_DIR}/" 2>/dev/null || echo "⚠️  ultrahdr_app.wasm not found"
cp "${BUILD_DIR}/examples/ultrahdr_app.js" "${SCRIPT_DIR}/" 2>/dev/null || echo "⚠️  ultrahdr_app.js not found in examples"
cp "${BUILD_DIR}/examples/ultrahdr_app.wasm" "${SCRIPT_DIR}/" 2>/dev/null || echo "⚠️  ultrahdr_app.wasm not found in examples"

echo "✅ Build complete!"
echo "📁 WASM files should be in: ${SCRIPT_DIR}/"
echo ""
echo "To test the UI, run: python3 -m http.server 8000"
echo "Then open: http://localhost:8000/index.html"

