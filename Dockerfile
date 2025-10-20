FROM debian:latest

# Prevent interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    git \
    exiftool \
    # ffmpeg \
    libjpeg-dev \
    libpng-dev \
    libjpeg-turbo-progs \
    autoconf \
    automake \
    libtool \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Clone and build libultrahdr
RUN git clone https://github.com/google/libultrahdr /tmp/libultrahdr && \
    cd /tmp/libultrahdr && \
    cmake -S. -Bbuild \
        -DCMAKE_BUILD_TYPE=Release \
        -DCMAKE_INSTALL_PREFIX=/usr/local \
        -DUHDR_BUILD_TESTS=OFF \
        -DUHDR_BUILD_BENCHMARK=OFF \
        -DUHDR_BUILD_EXAMPLES=ON \
        -DUHDR_ENABLE_LOGS=OFF \
        -DUHDR_WRITE_XMP=1 && \
    cmake --build build --parallel $(nproc) && \
    cmake --install build && \
    ldconfig && \
    rm -rf /tmp/libultrahdr

# Clone and build ImageMagick with UHDR support
RUN git clone --depth 1 https://github.com/ImageMagick/ImageMagick.git /tmp/ImageMagick && \
    cd /tmp/ImageMagick && \
    autoreconf -fiv && \
    PKG_CONFIG_PATH=/usr/local/lib/pkgconfig:$PKG_CONFIG_PATH \
    CPPFLAGS="-I/usr/local/include" \
    LDFLAGS="-L/usr/local/lib" \
    ./configure \
        --prefix=/usr/local \
        --with-uhdr=yes \
        --enable-shared \
        --disable-static \
        --without-modules \
        --disable-opencl \
        --with-quantum-depth=16 \
        --with-jpeg=yes \
        --with-png=yes \
        --without-perl \
        --without-x && \
    make -j$(nproc) && \
    make install && \
    ldconfig && \
    rm -rf /tmp/ImageMagick

# Copy scripts and configuration files
COPY convert-to-iso-hdr.sh /usr/local/bin/convert-to-iso-hdr.sh
COPY hdr-config.cfg /usr/local/bin/hdr-config.cfg
COPY entrypoint.sh /usr/local/bin/entrypoint.sh

# Make scripts executable
RUN chmod +x /usr/local/bin/convert-to-iso-hdr.sh && \
    chmod +x /usr/local/bin/entrypoint.sh

# Update convert-to-iso-hdr.sh to use correct paths in container
RUN sed -i 's|./ultrahdr_app|ultrahdr_app|g' /usr/local/bin/convert-to-iso-hdr.sh && \
    sed -i 's|"$SCRIPT_DIR_PATH/hdr-config.cfg"|"/usr/local/bin/hdr-config.cfg"|g' /usr/local/bin/convert-to-iso-hdr.sh && \
    sed -i 's|command -v ./ultrahdr_app|command -v ultrahdr_app|g' /usr/local/bin/convert-to-iso-hdr.sh

# Set the working directory for file operations
WORKDIR /data

# Set entrypoint
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

# Default command (shows help)
CMD []

