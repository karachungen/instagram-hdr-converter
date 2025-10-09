FROM debian:latest

# Prevent interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    git \
    exiftool \
    ffmpeg \
    libjpeg-dev \
    imagemagick \
    libjpeg-turbo-progs \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Clone and build libultrahdr
RUN git clone https://github.com/google/libultrahdr /tmp/libultrahdr && \
    cd /tmp/libultrahdr && \
    cmake -S. -Bbuild -DUHDR_WRITE_XMP=1 && \
    cmake --build build && \
    cp build/ultrahdr_app /usr/local/bin/ && \
    cp build/libuhdr*.so* /usr/local/lib/ 2>/dev/null || true && \
    cp build/libuhdr*.dylib /usr/local/lib/ 2>/dev/null || true && \
    ldconfig 2>/dev/null || true && \
    cd / && \
    rm -rf /tmp/libultrahdr

# Copy scripts and configuration files
COPY convert-to-iso-hdr.sh /usr/local/bin/convert-to-iso-hdr.sh
COPY hdr-config.cfg /usr/local/bin/hdr-config.cfg
COPY entrypoint.sh /usr/local/bin/entrypoint.sh

# Make scripts executable
RUN chmod +x /usr/local/bin/convert-to-iso-hdr.sh && \
    chmod +x /usr/local/bin/entrypoint.sh

# Update convert-to-iso-hdr.sh to use correct paths in container
RUN sed -i 's|./ultrahdr_app|ultrahdr_app|g' /usr/local/bin/convert-to-iso-hdr.sh && \
    sed -i 's|"$SCRIPT_DIR_PATH/hdr-config.cfg"|"/usr/local/bin/hdr-config.cfg"|g' /usr/local/bin/convert-to-iso-hdr.sh

# Set the working directory for file operations
WORKDIR /data

# Set entrypoint
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

# Default command (shows help)
CMD []

