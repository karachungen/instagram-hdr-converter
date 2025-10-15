#!/bin/bash

set -e

echo "🐳 Building libultrahdr WASM using Docker..."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PUBLIC_DIR="${SCRIPT_DIR}/public"

# Ensure public directory exists
mkdir -p "${PUBLIC_DIR}"

# Build the Docker image
echo "📦 Building Docker image..."
docker build -t libultrahdr-wasm -f "${SCRIPT_DIR}/Dockerfile.wasm" "${SCRIPT_DIR}"

# Extract WASM files directly to public directory
echo "📋 Extracting WASM files to public/..."
docker run --rm -v "${PUBLIC_DIR}:/output" libultrahdr-wasm bash -c "
    find /build/libultrahdr/build -name 'ultrahdr_app.wasm' -exec cp {} /output/ \;
    find /build/libultrahdr/build -name 'ultrahdr_app.js' -exec cp {} /output/ \;
    ls -lh /output/ultrahdr_app.*
"

echo ""
echo "✅ Build complete!"
echo "📁 WASM files copied to: ${PUBLIC_DIR}/"
echo ""
echo "🚀 To run the UI:"
echo "   pnpm dev"
echo "   Open: http://localhost:3001"

