#!/bin/bash

set -e

echo "🐳 Building libultrahdr WASM using Docker..."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Build the Docker image
echo "📦 Building Docker image..."
docker build -t libultrahdr-wasm -f "${SCRIPT_DIR}/Dockerfile.wasm" "${SCRIPT_DIR}"

# Create a container and copy files
echo "📋 Extracting WASM files..."
CONTAINER_ID=$(docker create libultrahdr-wasm)
docker cp "${CONTAINER_ID}:/output/" "${SCRIPT_DIR}/wasm-files/"
docker rm "${CONTAINER_ID}"

# Also extract directly from build directory
docker run --rm -v "${SCRIPT_DIR}:/host" libultrahdr-wasm bash -c "
    find /build/libultrahdr/build -name '*.wasm' -exec cp {} /host/ \;
    find /build/libultrahdr/build -name '*.js' -exec cp {} /host/ \;
    ls -la /host/
"

echo "✅ Build complete!"
echo "📁 WASM files are in: ${SCRIPT_DIR}/"
echo ""
echo "🚀 To test the UI:"
echo "   cd ${SCRIPT_DIR}"
echo "   python3 -m http.server 8000"
echo "   Open: http://localhost:8000/index.html"

