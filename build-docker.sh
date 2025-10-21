#!/bin/bash
# Docker-compatible build script for ImageMagick with libultrahdr support
# Can be used in both CLI and UI Docker builds

set -e

# Configuration
INSTALL_PREFIX="${INSTALL_PREFIX:-/usr/local}"
NUM_CORES="${NUM_CORES:-$(nproc 2>/dev/null || echo 4)}"
BUILD_DIR="/tmp/build"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_error() {
    echo -e "${RED}Error: $1${NC}" >&2
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}→ $1${NC}"
}

print_step() {
    echo -e "${BLUE}===> $1${NC}"
}

# Create build directory
mkdir -p "$BUILD_DIR"

# Step 1: Build libhwy (Highway - required for libjxl)
print_step "Building libhwy (Highway)"

print_info "Cloning libhwy repository..."
git clone --depth 1 --branch 1.0.7 https://github.com/google/highway.git "$BUILD_DIR/highway"
cd "$BUILD_DIR/highway"

print_info "Configuring libhwy..."
cmake -S. -Bbuild \
    -DCMAKE_BUILD_TYPE=Release \
    -DCMAKE_INSTALL_PREFIX="$INSTALL_PREFIX" \
    -DBUILD_TESTING=OFF \
    -DHWY_ENABLE_EXAMPLES=OFF \
    -DHWY_ENABLE_TESTS=OFF

print_info "Building libhwy..."
cmake --build build --parallel $NUM_CORES

print_info "Installing libhwy..."
cmake --install build

if command -v ldconfig &> /dev/null; then
    ldconfig
fi

print_success "libhwy installed successfully"

# Step 2: Build libjxl (JPEG XL support)
print_step "Building libjxl"

print_info "Cloning libjxl repository..."
git clone --depth 1 --branch v0.10.3 https://github.com/libjxl/libjxl.git "$BUILD_DIR/libjxl"
cd "$BUILD_DIR/libjxl"

print_info "Configuring libjxl..."
cmake -S. -Bbuild \
    -DCMAKE_BUILD_TYPE=Release \
    -DCMAKE_INSTALL_PREFIX="$INSTALL_PREFIX" \
    -DCMAKE_PREFIX_PATH="$INSTALL_PREFIX" \
    -DBUILD_TESTING=OFF \
    -DJPEGXL_ENABLE_TOOLS=OFF \
    -DJPEGXL_ENABLE_MANPAGES=OFF \
    -DJPEGXL_ENABLE_BENCHMARK=OFF \
    -DJPEGXL_ENABLE_EXAMPLES=OFF

print_info "Building libjxl..."
cmake --build build --parallel $NUM_CORES

print_info "Installing libjxl..."
cmake --install build

if command -v ldconfig &> /dev/null; then
    ldconfig
fi

print_success "libjxl installed successfully"

# Step 3: Build libheif (AVIF/HEIF support)
print_step "Building libheif"

print_info "Cloning libheif repository..."
git clone --depth 1 --branch v1.18.2 https://github.com/strukturag/libheif.git "$BUILD_DIR/libheif"
cd "$BUILD_DIR/libheif"

print_info "Configuring libheif..."
cmake -S. -Bbuild \
    -DCMAKE_BUILD_TYPE=Release \
    -DCMAKE_INSTALL_PREFIX="$INSTALL_PREFIX" \
    -DWITH_EXAMPLES=OFF \
    -DWITH_AOM_DECODER=ON \
    -DWITH_AOM_ENCODER=ON

print_info "Building libheif..."
cmake --build build --parallel $NUM_CORES

print_info "Installing libheif..."
cmake --install build

if command -v ldconfig &> /dev/null; then
    ldconfig
fi

print_success "libheif installed successfully"

# Step 4: Build libultrahdr
print_step "Building libultrahdr"

print_info "Cloning libultrahdr repository..."
git clone https://github.com/google/libultrahdr "$BUILD_DIR/libultrahdr"

cd "$BUILD_DIR/libultrahdr"

print_info "Configuring libultrahdr..."
cmake -S. -Bbuild \
    -DCMAKE_BUILD_TYPE=Release \
    -DCMAKE_INSTALL_PREFIX="$INSTALL_PREFIX" \
    -DUHDR_BUILD_TESTS=OFF \
    -DUHDR_BUILD_BENCHMARK=OFF \
    -DUHDR_BUILD_EXAMPLES=ON \
    -DUHDR_ENABLE_LOGS=OFF \
    -DUHDR_WRITE_XMP=1

print_info "Building libultrahdr..."
cmake --build build --parallel $NUM_CORES

print_info "Installing libultrahdr..."
cmake --install build

# Run ldconfig on Linux
if command -v ldconfig &> /dev/null; then
    ldconfig
fi

print_success "libultrahdr installed successfully"

# Step 5: Build ImageMagick
print_step "Building ImageMagick"

print_info "Cloning ImageMagick repository..."
git clone --depth 1 https://github.com/ImageMagick/ImageMagick.git "$BUILD_DIR/ImageMagick"

cd "$BUILD_DIR/ImageMagick"

print_info "Generating configure script..."
autoreconf -fiv

print_info "Configuring ImageMagick with UHDR, JXL, and HEIF support..."
PKG_CONFIG_PATH="$INSTALL_PREFIX/lib/pkgconfig:$PKG_CONFIG_PATH" \
CPPFLAGS="-I$INSTALL_PREFIX/include" \
LDFLAGS="-L$INSTALL_PREFIX/lib" \
./configure \
    --prefix="$INSTALL_PREFIX" \
    --with-uhdr=yes \
    --with-jxl=yes \
    --with-heic=yes \
    --enable-shared \
    --disable-static \
    --without-modules \
    --disable-opencl \
    --with-quantum-depth=16 \
    --with-jpeg=yes \
    --with-png=yes \
    --without-perl \
    --without-x

print_info "Building ImageMagick..."
make -j$NUM_CORES

print_info "Installing ImageMagick..."
make install

# Run ldconfig on Linux
if command -v ldconfig &> /dev/null; then
    ldconfig
fi

print_success "ImageMagick installed successfully"

# Verify installation
print_step "Verifying installation"

if command -v ultrahdr_app &> /dev/null; then
    print_success "ultrahdr_app installed"
else
    print_error "ultrahdr_app not found"
    exit 1
fi

if command -v magick &> /dev/null; then
    MAGICK_VERSION=$(magick -version 2>&1 | head -n 1)
    print_success "ImageMagick installed: $MAGICK_VERSION"
    
    if magick -list configure 2>&1 | grep -q "DELEGATES.*uhdr"; then
        print_success "UHDR support is enabled!"
    else
        print_error "UHDR support not found in delegates"
        exit 1
    fi
else
    print_error "magick binary not found"
    exit 1
fi

# Cleanup
print_info "Cleaning up build directory..."
rm -rf "$BUILD_DIR"

print_success "Build complete!"

