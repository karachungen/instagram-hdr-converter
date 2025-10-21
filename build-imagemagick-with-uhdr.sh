#!/bin/bash
# Build ImageMagick with libultrahdr support

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored messages
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

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_DIR="$SCRIPT_DIR/build-imagemagick"
INSTALL_PREFIX="${INSTALL_PREFIX:-$SCRIPT_DIR/local}"
NUM_CORES=$(sysctl -n hw.ncpu 2>/dev/null || echo 4)

usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Build ImageMagick with libultrahdr support from source.

OPTIONS:
    --prefix <path>         Installation prefix (default: ./local)
    --build-dir <path>      Build directory (default: ./build-imagemagick)
    --clean                 Clean build directory before building
    -j, --jobs <number>     Number of parallel jobs (default: $NUM_CORES)
    -h, --help              Show this help message

EXAMPLES:
    $0                      # Build to ./local and create executables in current dir
    $0 --prefix ~/custom    # Install to custom location
    $0 --clean              # Clean build and rebuild

REQUIREMENTS:
    - Xcode Command Line Tools
    - CMake (brew install cmake)
    - pkg-config (brew install pkg-config)
    - autoconf (brew install autoconf)
    - automake (brew install automake)
    - libtool (brew install libtool)
    - libjpeg (brew install jpeg)
    - libpng (brew install libpng)

NOTES:
    - This script builds both libultrahdr and ImageMagick locally
    - Creates 'ultrahdr_app' and 'magick' executables in current directory
    - No sudo required - everything installs to ./local by default
    - Build process takes 10-30 minutes depending on your system
EOF
    exit 0
}

# Parse command line arguments
CLEAN_BUILD=false
JOBS=$NUM_CORES

while [[ $# -gt 0 ]]; do
    case $1 in
        --prefix)
            INSTALL_PREFIX="$2"
            shift 2
            ;;
        --build-dir)
            BUILD_DIR="$2"
            shift 2
            ;;
        --clean)
            CLEAN_BUILD=true
            shift
            ;;
        -j|--jobs)
            JOBS="$2"
            shift 2
            ;;
        -h|--help)
            usage
            ;;
        *)
            print_error "Unknown argument: $1"
            usage
            ;;
    esac
done

print_step "ImageMagick with libultrahdr Build Script"
echo "Build directory: $BUILD_DIR"
echo "Install prefix: $INSTALL_PREFIX"
echo "Parallel jobs: $JOBS"
echo ""

# Check dependencies
print_step "Checking dependencies..."

check_command() {
    if ! command -v "$1" &> /dev/null; then
        print_error "$1 not found. Install with: brew install $2"
        exit 1
    fi
    print_success "$1 found"
}

check_command "cmake" "cmake"
check_command "pkg-config" "pkg-config"
check_command "git" "git"
check_command "autoconf" "autoconf"
check_command "automake" "automake"

# Check for required libraries
print_info "Checking for required libraries..."
for lib in jpeg png; do
    if pkg-config --exists lib$lib 2>/dev/null; then
        print_success "lib$lib found"
    else
        print_error "lib$lib not found. Install with: brew install $lib"
        exit 1
    fi
done

# Check for libtool (provides libltdl)
if command -v libtool &> /dev/null; then
    print_success "libtool found"
else
    print_error "libtool not found. Install with: brew install libtool"
    exit 1
fi

# Clean build directory if requested
if [ "$CLEAN_BUILD" = true ] && [ -d "$BUILD_DIR" ]; then
    print_info "Cleaning build directory..."
    rm -rf "$BUILD_DIR"
    print_success "Build directory cleaned"
fi

# Create build directory
mkdir -p "$BUILD_DIR"
cd "$BUILD_DIR"

# Step 1: Build libultrahdr
print_step "Step 1: Building libultrahdr"

if [ ! -d "libultrahdr" ]; then
    print_info "Cloning libultrahdr repository..."
    git clone https://github.com/google/libultrahdr.git
    print_success "Repository cloned"
else
    print_info "Using existing libultrahdr repository"
    cd libultrahdr
    git pull origin main || true
    cd ..
fi

cd libultrahdr

print_info "Configuring libultrahdr..."
cmake -S. -Bbuild \
    -DCMAKE_BUILD_TYPE=Release \
    -DCMAKE_INSTALL_PREFIX="$INSTALL_PREFIX" \
    -DUHDR_BUILD_TESTS=OFF \
    -DUHDR_BUILD_BENCHMARK=OFF \
    -DUHDR_BUILD_EXAMPLES=ON \
    -DUHDR_ENABLE_LOGS=OFF \
    -DUHDR_WRITE_XMP=1

print_info "Building libultrahdr (this may take a few minutes)..."
cmake --build build --parallel $JOBS

print_info "Installing libultrahdr..."
cmake --install build

print_success "libultrahdr installed successfully"

# Copy ultrahdr_app to script directory
print_info "Copying ultrahdr_app to $SCRIPT_DIR..."
if [ -f "build/ultrahdr_app" ]; then
    cp build/ultrahdr_app "$SCRIPT_DIR/"
    chmod +x "$SCRIPT_DIR/ultrahdr_app"
    print_success "ultrahdr_app copied to script directory"
else
    print_error "ultrahdr_app not found in build directory"
fi

# Update pkg-config path if custom prefix
if [ "$INSTALL_PREFIX" != "/usr/local" ]; then
    export PKG_CONFIG_PATH="$INSTALL_PREFIX/lib/pkgconfig:$PKG_CONFIG_PATH"
    print_info "PKG_CONFIG_PATH updated for custom prefix"
fi

cd "$BUILD_DIR"

# Step 2: Build ImageMagick
print_step "Step 2: Building ImageMagick"

if [ ! -d "ImageMagick/.git" ]; then
    print_info "Cloning ImageMagick repository..."
    rm -rf ImageMagick
    git clone --depth 1 https://github.com/ImageMagick/ImageMagick.git
    print_success "Repository cloned"
else
    print_info "Using existing ImageMagick repository"
fi

cd ImageMagick

# Generate configure script if it doesn't exist
if [ ! -f "configure" ]; then
    print_info "Generating configure script with autoreconf..."
    autoreconf -fiv
fi

print_info "Verifying libuhdr is available..."

# Set up environment for configure
export PKG_CONFIG_PATH="$INSTALL_PREFIX/lib/pkgconfig:$(brew --prefix 2>/dev/null)/lib/pkgconfig:$PKG_CONFIG_PATH"
export CPPFLAGS="-I$INSTALL_PREFIX/include"
export LDFLAGS="-L$INSTALL_PREFIX/lib"

# Add brew lib path if on macOS
if command -v brew &> /dev/null; then
    BREW_PREFIX=$(brew --prefix)
    export LDFLAGS="$LDFLAGS -L$BREW_PREFIX/lib"
fi

# Verify libuhdr is found by pkg-config (note: package name is libuhdr, not libultrahdr)
if pkg-config --exists libuhdr 2>/dev/null; then
    UHDR_VERSION=$(pkg-config --modversion libuhdr)
    print_success "libuhdr found via pkg-config (version $UHDR_VERSION)"
    print_info "UHDR CFLAGS: $(pkg-config --cflags libuhdr)"
    print_info "UHDR LIBS: $(pkg-config --libs libuhdr)"
else
    print_error "libuhdr not found by pkg-config"
    print_info "PKG_CONFIG_PATH: $PKG_CONFIG_PATH"
    print_info "Available .pc files:"
    ls -1 "$INSTALL_PREFIX/lib/pkgconfig/" 2>/dev/null || echo "No pkgconfig directory found"
    exit 1
fi

print_info "Configuring ImageMagick with libultrahdr support..."

# Configure flags - matching Dockerfile approach
PKG_CONFIG_PATH="$PKG_CONFIG_PATH" \
CPPFLAGS="$CPPFLAGS" \
LDFLAGS="$LDFLAGS" \
./configure \
    --prefix="$INSTALL_PREFIX" \
    --with-uhdr=yes \
    --enable-shared \
    --disable-static \
    --without-modules \
    --disable-opencl \
    --with-quantum-depth=16 \
    --with-jpeg=yes \
    --with-png=yes \
    --without-perl \
    --without-x

# Verify UHDR was detected in configuration
print_info "Verifying UHDR was detected by configure..."
if grep -q "checking for UHDR.*yes" config.log 2>/dev/null || \
   grep -q "UHDR.*yes" config.log 2>/dev/null; then
    print_success "UHDR support detected in configuration"
else
    print_error "UHDR support may not have been detected properly"
    print_info "Checking config.log for UHDR references..."
    grep -i "uhdr" config.log | tail -20 || echo "No UHDR references found in config.log"
fi

print_info "Building ImageMagick (this may take 10-20 minutes)..."
make -j$JOBS

print_info "Installing ImageMagick..."
make install

print_success "ImageMagick installed successfully"

# Copy magick binary to script directory
print_info "Copying magick binary to $SCRIPT_DIR..."
if [ -f "$INSTALL_PREFIX/bin/magick" ]; then
    cp "$INSTALL_PREFIX/bin/magick" "$SCRIPT_DIR/"
    chmod +x "$SCRIPT_DIR/magick"
    print_success "magick binary copied to script directory"
else
    print_error "magick binary not found at $INSTALL_PREFIX/bin/magick"
fi

cd "$SCRIPT_DIR"

# Verify installation
print_step "Verifying installation..."

# Set environment for local binaries
export DYLD_LIBRARY_PATH="$INSTALL_PREFIX/lib:$DYLD_LIBRARY_PATH"

# Test ultrahdr_app
if [ -f "$SCRIPT_DIR/ultrahdr_app" ]; then
    print_success "ultrahdr_app found in $SCRIPT_DIR"
else
    print_error "ultrahdr_app not found in $SCRIPT_DIR"
    exit 1
fi

# Test magick with local libraries
if [ -f "$SCRIPT_DIR/magick" ]; then
    MAGICK_VERSION=$("$SCRIPT_DIR/magick" -version 2>&1 | head -n 1)
    print_success "ImageMagick binary found: $MAGICK_VERSION"
    
    print_info "Checking UHDR delegate support..."
    if "$SCRIPT_DIR/magick" -list configure 2>&1 | grep -q "DELEGATES.*uhdr"; then
        print_success "UHDR support is enabled!"
    else
        print_error "UHDR support not found in delegates"
        print_info "Delegates found:"
        "$SCRIPT_DIR/magick" -list configure 2>&1 | grep DELEGATES
        exit 1
    fi
else
    print_error "magick binary not found in $SCRIPT_DIR"
    exit 1
fi

# Print final instructions
print_step "Installation Complete!"
echo ""
print_success "Local build completed successfully!"
echo ""
echo "Build details:"
echo "  - Install prefix: $INSTALL_PREFIX"
echo "  - Libraries: $INSTALL_PREFIX/lib"
echo "  - Executables created in: $SCRIPT_DIR"
echo ""
echo "Executables:"
echo "  - $SCRIPT_DIR/ultrahdr_app  (libultrahdr CLI tool)"
echo "  - $SCRIPT_DIR/magick        (ImageMagick with UHDR support)"
echo ""
echo "Test your local binaries:"
echo "  ./magick -version"
echo "  ./magick -list configure | grep uhdr"
echo "  ./ultrahdr_app -h"
echo ""
echo "Try converting HDR images:"
echo "  ./convert-to-iso-hdr.sh photo.jpg    # HDR JPEG"
echo "  ./convert-to-iso-hdr.sh photo.jxl    # JXL"
echo "  ./convert-to-iso-hdr.sh photo.avif   # AVIF"
echo ""
echo "Note: Set DYLD_LIBRARY_PATH if needed:"
echo "  export DYLD_LIBRARY_PATH=\"$INSTALL_PREFIX/lib:\$DYLD_LIBRARY_PATH\""
echo ""
print_success "Build complete!"

